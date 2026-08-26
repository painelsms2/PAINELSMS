-- 15_dynamic_pricing.sql

-- Update purchase_number to accept optional p_sale_price and p_cost_price
-- This allows the server to dynamically adjust the price (e.g. for DDD selection)
-- while keeping the atomic balance deduction and stock decrement safe.

DROP FUNCTION IF EXISTS public.purchase_number(uuid, text, text);

CREATE OR REPLACE FUNCTION public.purchase_number(
  p_service_offer_id uuid,
  p_phone_number text,
  p_provider_activation_id text,
  p_sale_price numeric DEFAULT NULL,
  p_cost_price numeric DEFAULT NULL
)
RETURNS public.activations AS $$
DECLARE
  v_offer public.service_offers%ROWTYPE;
  v_balance numeric(12,2);
  v_act public.activations;
  v_final_sale_price numeric(12,2);
  v_final_cost_price numeric(12,2);
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

  -- Determine final prices (use overrides if provided, otherwise default to offer prices)
  v_final_sale_price := COALESCE(p_sale_price, v_offer.sale_price);
  v_final_cost_price := COALESCE(p_cost_price, v_offer.cost_price);

  -- 2. Check balance against SALE PRICE and lock profile
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_balance < v_final_sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.service_offers SET stock = stock - 1 WHERE id = p_service_offer_id;

  -- 4. Deduct balance immediately
  UPDATE public.profiles SET balance = balance - v_final_sale_price WHERE id = auth.uid();

  -- 5. Create activation with REAL number from provider and final prices
  INSERT INTO public.activations (
    user_id, service_id, provider_id, service_offer_id, phone_number, provider_activation_id, status, price, cost_price, expires_at
  ) VALUES (
    auth.uid(), v_offer.service_id, v_offer.provider_id, v_offer.id, p_phone_number, p_provider_activation_id, 'waiting', v_final_sale_price, v_final_cost_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  -- 6. Insert transaction record for the purchase
  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (auth.uid(), 'activation_charge', -v_final_sale_price, 'completed', v_act.id::text);

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
