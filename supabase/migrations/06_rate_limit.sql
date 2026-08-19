-- 06_rate_limit.sql

-- Modify purchase_number to include a rate limit and prevent double-clicks
CREATE OR REPLACE FUNCTION public.purchase_number(p_service_id text)
RETURNS public.activations AS $$
DECLARE
  v_svc public.services%ROWTYPE;
  v_balance numeric(12,2);
  v_act public.activations;
  v_phone text;
BEGIN
  -- 0. Rate Limit: Check if the user has purchased anything in the last 3 seconds
  IF EXISTS (
    SELECT 1 FROM public.activations 
    WHERE user_id = auth.uid() 
    AND created_at > now() - interval '3 seconds'
  ) THEN
    RAISE EXCEPTION 'Aguarde alguns segundos antes de comprar outro número (Rate limit).';
  END IF;

  -- 1. Check stock and lock row
  SELECT * INTO v_svc FROM public.services WHERE id = p_service_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  IF v_svc.stock <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 2. Check balance against SALE PRICE
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_balance < v_svc.sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.services SET stock = stock - 1 WHERE id = p_service_id;

  -- 4. Deduct balance immediately
  UPDATE public.profiles SET balance = balance - v_svc.sale_price WHERE id = auth.uid();

  -- 5. Create activation with simulated number (will be overwritten by frontend)
  v_phone := '+55 ' || (floor(random() * 89) + 11)::text || ' ' || (floor(random() * 90000000) + 900000000)::text;

  INSERT INTO public.activations (
    user_id, service_id, phone_number, status, price, expires_at
  ) VALUES (
    auth.uid(), p_service_id, v_phone, 'waiting', v_svc.sale_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  -- 6. Insert transaction record for the purchase
  INSERT INTO public.transactions (user_id, type, amount, status, reference)
  VALUES (auth.uid(), 'activation_charge', -v_svc.sale_price, 'completed', v_act.id::text);

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
