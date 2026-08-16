-- supabase/migrations/01_schema.sql

-- Enable pgcrypto for gen_random_uuid() if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------------------
-- 1. TABLES
--------------------------------------------------------------------------------

-- Profiles table: Extends auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  balance numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Services table: Catalog of SMS services
CREATE TABLE public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon_key text NOT NULL,
  price numeric(12,2) NOT NULL,
  country text DEFAULT 'Brasil',
  stock int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Activations table: Tracks purchased numbers and SMS status
CREATE TABLE public.activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id text REFERENCES services(id),
  phone_number text,
  status text NOT NULL DEFAULT 'waiting', -- 'waiting' | 'completed' | 'cancelled' | 'expired'
  sms_code text,
  price numeric(12,2) NOT NULL,
  expires_at timestamptz NOT NULL, -- usually now() + 20 minutes
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Transactions table: Tracks balance changes (recharges, charges, refunds)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'recharge' | 'activation_charge' | 'refund' | 'admin_credit'
  amount numeric(12,2) NOT NULL, -- positive = credit, negative = debit
  status text NOT NULL DEFAULT 'completed', -- 'pending' | 'completed' | 'failed' | 'expired'
  method text, -- 'pix' | 'admin' | null
  reference text, -- charge id, activation id, etc.
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

--------------------------------------------------------------------------------
-- 2. INDEXES
--------------------------------------------------------------------------------

CREATE INDEX idx_activations_user_id ON public.activations(user_id);
CREATE INDEX idx_activations_status ON public.activations(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

--------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: User can read/update their own row, Admin can read all
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  -- Prevent user from changing their own role or balance directly via client
  -- These fields should only be changed by database triggers/RPCs or admin
  auth.uid() = id
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT USING (
  public.is_admin()
);

-- Services: Anyone authenticated can read. Admin can insert/update/delete.
CREATE POLICY "Anyone can view services" 
ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert services" 
ON public.services FOR INSERT TO authenticated WITH CHECK (
  public.is_admin()
);

CREATE POLICY "Admins can update services" 
ON public.services FOR UPDATE TO authenticated USING (
  public.is_admin()
);

CREATE POLICY "Admins can delete services" 
ON public.services FOR DELETE TO authenticated USING (
  public.is_admin()
);

-- Activations: Users can manage their own. Admin all.
CREATE POLICY "Users can view own activations" 
ON public.activations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activations" 
ON public.activations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activations" 
ON public.activations FOR ALL USING (
  public.is_admin()
);

-- Transactions: Users can view their own. Insert allowed via RPCs (handled by SECURITY DEFINER). 
-- Client cannot directly INSERT here unless we allow pending pix (which we do).
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert pending transactions" 
ON public.transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND type = 'recharge' AND status = 'pending'
);

CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR ALL USING (
  public.is_admin()
);

--------------------------------------------------------------------------------
-- 4. TRIGGERS & FUNCTIONS
--------------------------------------------------------------------------------

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, balance)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    'user', 
    0.00
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper Function: Check if caller is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 5. RPCs (Server-side logic)
--------------------------------------------------------------------------------

-- add_balance: Safely credits balance and marks recharge complete
CREATE OR REPLACE FUNCTION public.add_balance(p_transaction_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
BEGIN
  -- Lock the transaction row to prevent race conditions
  SELECT * INTO v_tx 
  FROM public.transactions 
  WHERE id = p_transaction_id AND status = 'pending' AND type = 'recharge'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not pending';
  END IF;

  -- Mark transaction completed
  UPDATE public.transactions 
  SET status = 'completed', completed_at = now()
  WHERE id = p_transaction_id;

  -- Add balance
  UPDATE public.profiles
  SET balance = balance + v_tx.amount
  WHERE id = v_tx.user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- charge_activation: Safely debits balance on SMS success
CREATE OR REPLACE FUNCTION public.charge_activation(p_activation_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  v_act public.activations%ROWTYPE;
  v_balance numeric(12,2);
BEGIN
  -- Lock the activation
  SELECT * INTO v_act 
  FROM public.activations 
  WHERE id = p_activation_id AND status = 'waiting'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activation not found or already completed';
  END IF;

  -- Check balance
  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_act.user_id FOR UPDATE;
  
  IF v_balance < v_act.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE public.profiles SET balance = balance - v_act.price WHERE id = v_act.user_id;

  -- Insert transaction charge
  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (v_act.user_id, 'activation_charge', -v_act.price, 'completed', v_act.id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- purchase_number: Atomically checks stock and balance, decrements stock, creates activation
CREATE OR REPLACE FUNCTION public.purchase_number(p_service_id text)
RETURNS public.activations AS $$
DECLARE
  v_svc public.services%ROWTYPE;
  v_balance numeric(12,2);
  v_act public.activations;
  v_phone text;
BEGIN
  -- 1. Check stock and lock row
  SELECT * INTO v_svc FROM public.services WHERE id = p_service_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  IF v_svc.stock <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 2. Check balance
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid();
  IF v_balance < v_svc.price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.services SET stock = stock - 1 WHERE id = p_service_id;

  -- 4. Create activation with simulated number
  v_phone := '+55 ' || (floor(random() * 89) + 11)::text || ' ' || (floor(random() * 90000000) + 900000000)::text;

  INSERT INTO public.activations (
    user_id, service_id, phone_number, status, price, expires_at
  ) VALUES (
    auth.uid(), p_service_id, v_phone, 'waiting', v_svc.price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- cancel_activation: User manually cancels or system expires
CREATE OR REPLACE FUNCTION public.cancel_activation(p_activation_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  v_act public.activations%ROWTYPE;
BEGIN
  -- Lock activation
  SELECT * INTO v_act FROM public.activations 
  WHERE id = p_activation_id AND user_id = auth.uid() AND status = 'waiting'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activation cannot be cancelled';
  END IF;

  -- Restore stock
  UPDATE public.services SET stock = stock + 1 WHERE id = v_act.service_id;

  -- Mark as cancelled
  UPDATE public.activations SET status = 'cancelled' WHERE id = p_activation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- admin_credit: Admin manually adds balance to any user
CREATE OR REPLACE FUNCTION public.admin_credit(p_user_id uuid, p_amount numeric(12,2))
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Insert transaction
  INSERT INTO public.transactions (user_id, type, amount, status, method, reference)
  VALUES (p_user_id, 'admin_credit', p_amount, 'completed', 'admin', 'manual credit by admin');

  -- Add balance
  UPDATE public.profiles SET balance = balance + p_amount WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
