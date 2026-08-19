-- 04_fix_purchase.sql
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

  -- 2. Check balance against SALE PRICE
  SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid();
  IF v_balance < v_svc.sale_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 3. Decrement stock
  UPDATE public.services SET stock = stock - 1 WHERE id = p_service_id;

  -- 4. Create activation with simulated number (will be overwritten by frontend)
  v_phone := '+55 ' || (floor(random() * 89) + 11)::text || ' ' || (floor(random() * 90000000) + 900000000)::text;

  INSERT INTO public.activations (
    user_id, service_id, phone_number, status, price, expires_at
  ) VALUES (
    auth.uid(), p_service_id, v_phone, 'waiting', v_svc.sale_price, now() + interval '20 minutes'
  ) RETURNING * INTO v_act;

  RETURN v_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
