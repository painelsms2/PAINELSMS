-- 18_secure_add_balance.sql

-- Restrict add_balance to only be callable by the service_role (backend API)
-- to prevent clients from maliciously completing pending transactions.
CREATE OR REPLACE FUNCTION public.add_balance(p_transaction_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
BEGIN
  -- MUST BE CALLED BY SERVICE_ROLE (backend) to prevent client abuse
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Must be called from secure backend';
  END IF;

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
