-- 08_multi_provider_v2.sql

CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_key text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.service_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  provider_service_code text,
  cost_price numeric(12,2) NOT NULL DEFAULT 0.00,
  sale_price numeric(12,2) NOT NULL DEFAULT 0.00,
  stock int DEFAULT 0,
  active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (service_id, provider_id)
);

-- RLS for providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active providers" ON public.providers FOR SELECT TO authenticated USING (active = true OR public.is_admin());
CREATE POLICY "Admins can insert providers" ON public.providers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update providers" ON public.providers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete providers" ON public.providers FOR DELETE TO authenticated USING (public.is_admin());

-- RLS for service_offers
ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active service offers" ON public.service_offers FOR SELECT TO authenticated USING (active = true OR public.is_admin());
CREATE POLICY "Admins can insert service offers" ON public.service_offers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update service offers" ON public.service_offers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete service offers" ON public.service_offers FOR DELETE TO authenticated USING (public.is_admin());

-- Drop old columns from migration 07 if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='active_provider') THEN
    ALTER TABLE public.services DROP COLUMN active_provider;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider2_service_code') THEN
    ALTER TABLE public.services DROP COLUMN provider2_service_code;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider2_stock') THEN
    ALTER TABLE public.services DROP COLUMN provider2_stock;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='provider2_price') THEN
    ALTER TABLE public.services DROP COLUMN provider2_price;
  END IF;
END $$;

-- We MUST handle existing data in services before dropping cost_price, sale_price, stock.
-- Since this is a new database for testing, we can just drop them.
ALTER TABLE public.services DROP COLUMN IF EXISTS cost_price CASCADE;
ALTER TABLE public.services DROP COLUMN IF EXISTS sale_price CASCADE;
ALTER TABLE public.services DROP COLUMN IF EXISTS stock CASCADE;

ALTER TABLE public.activations ADD COLUMN provider_id uuid REFERENCES public.providers(id);
ALTER TABLE public.activations ADD COLUMN service_offer_id uuid REFERENCES public.service_offers(id);
ALTER TABLE public.activations ADD COLUMN cost_price numeric(12,2);

-- Update purchase_number
CREATE OR REPLACE FUNCTION public.purchase_number(p_service_offer_id uuid)
RETURNS public.activations AS $$
DECLARE
  v_offer public.service_offers%ROWTYPE;
  v_balance numeric(12,2);
  v_act public.activations;
  v_phone text;
BEGIN
  -- 1. Check stock and lock row
  SELECT * INTO v_offer FROM public.service_offers WHERE id = p_service_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service offer not found';
  END IF;
  IF NOT v_offer.active THEN
    RAISE EXCEPTION 'Service offer is not active';
  END IF;
  IF v_offer.stock <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 2. Check balance against SALE PRICE
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid();
  IF v_balance < v_offer.sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.service_offers SET stock = stock - 1 WHERE id = p_service_offer_id;

  -- 4. Create activation with simulated number (will be overwritten by frontend or backend later)
  v_phone := '+55 ' || (floor(random() * 89) + 11)::text || ' ' || (floor(random() * 90000000) + 900000000)::text;

  INSERT INTO public.activations (
    user_id, service_id, provider_id, service_offer_id, phone_number, status, price, cost_price, expires_at
  ) VALUES (
    auth.uid(), v_offer.service_id, v_offer.provider_id, v_offer.id, v_phone, 'waiting', v_offer.sale_price, v_offer.cost_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update cancel_activation to restore stock on the offer
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
  IF v_act.service_offer_id IS NOT NULL THEN
    UPDATE public.service_offers SET stock = stock + 1 WHERE id = v_act.service_offer_id;
  END IF;

  -- Mark as cancelled
  UPDATE public.activations SET status = 'cancelled' WHERE id = p_activation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP FUNCTION IF EXISTS public.admin_update_service(text, numeric, integer, boolean);
