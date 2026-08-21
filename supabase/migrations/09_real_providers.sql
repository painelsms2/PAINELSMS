-- 09_real_providers.sql

ALTER TABLE public.activations ADD COLUMN provider_activation_id text;

-- Update purchase_number to receive the real phone and provider ID from the server
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

  -- 2. Check balance against SALE PRICE
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid();
  IF v_balance < v_offer.sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.service_offers SET stock = stock - 1 WHERE id = p_service_offer_id;

  -- 4. Create activation with REAL number from provider
  INSERT INTO public.activations (
    user_id, service_id, provider_id, service_offer_id, phone_number, provider_activation_id, status, price, cost_price, expires_at
  ) VALUES (
    auth.uid(), v_offer.service_id, v_offer.provider_id, v_offer.id, p_phone_number, p_provider_activation_id, 'waiting', v_offer.sale_price, v_offer.cost_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
