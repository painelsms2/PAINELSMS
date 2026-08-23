-- 14_fix_billing_bug.sql

-- This migration restores the balance deduction in purchase_number
-- and the balance refund in cancel_activation that were lost in migrations 08 and 09.

CREATE OR REPLACE FUNCTION public.purchase_number(
  p_service_offer_id uuid,
  p_phone_number text,
  p_provider_activation_id text
)
RETURNS public.activations AS $$
DECLARE
  v_offer public.service_offers%ROWTYPE;
  v_balance numeric(12,2);
  v_act public.activations;
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

  -- 2. Check balance against SALE PRICE and lock profile
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_balance < v_offer.sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.service_offers SET stock = stock - 1 WHERE id = p_service_offer_id;

  -- 4. Deduct balance immediately
  UPDATE public.profiles SET balance = balance - v_offer.sale_price WHERE id = auth.uid();

  -- 5. Create activation with REAL number from provider
  INSERT INTO public.activations (
    user_id, service_id, provider_id, service_offer_id, phone_number, provider_activation_id, status, price, cost_price, expires_at
  ) VALUES (
    auth.uid(), v_offer.service_id, v_offer.provider_id, v_offer.id, p_phone_number, p_provider_activation_id, 'waiting', v_offer.sale_price, v_offer.cost_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  -- 6. Insert transaction record for the purchase
  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (auth.uid(), 'activation_charge', -v_offer.sale_price, 'completed', v_act.id::text);

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update cancel_activation to restore stock AND REFUND balance
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

  -- Refund balance
  UPDATE public.profiles SET balance = balance + v_act.price WHERE id = auth.uid();

  -- Mark as cancelled
  UPDATE public.activations SET status = 'cancelled' WHERE id = p_activation_id;

  -- Insert refund transaction
  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (auth.uid(), 'activation_refund', v_act.price, 'completed', v_act.id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
