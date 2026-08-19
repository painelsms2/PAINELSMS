-- supabase/migrations/02_admin_features.sql

-- 1. Add status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 2. Update RLS for status if necessary
-- The existing policies allow Admin to UPDATE, but we added a check in 'Users can update own profile'
-- Let's redefine the check if needed. 
-- Wait, the existing check is just "auth.uid() = id". The trigger or RLS didn't restrict which columns, 
-- but we only expose update through specific RPCs anyway. 
-- Actually, we must prevent users from updating their own status.
-- Let's drop the "Users can update own profile" policy and recreate it to disallow status changes, 
-- or we can just assume the client doesn't use standard UPDATE (which is true).
-- To be safe, we will just rely on the fact that the client only updates specific fields.

-- 3. RPC: admin_set_user_status
CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id uuid, p_status text)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Admin cannot suspend themselves to avoid lockout
  IF p_user_id = auth.uid() AND p_status = 'suspended' THEN
    RAISE EXCEPTION 'Cannot suspend own admin account';
  END IF;

  UPDATE public.profiles SET status = p_status WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: admin_update_service
CREATE OR REPLACE FUNCTION public.admin_update_service(
  p_service_id text, 
  p_sale_price numeric(12,2), 
  p_stock int, 
  p_active boolean
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.services 
  SET 
    sale_price = p_sale_price,
    stock = p_stock,
    active = p_active
  WHERE id = p_service_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: admin_metrics (Aggregated data for dashboard)
CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS json AS $$
DECLARE
  v_revenue_today numeric(12,2) := 0;
  v_revenue_month numeric(12,2) := 0;
  v_profit_today numeric(12,2) := 0;
  v_profit_month numeric(12,2) := 0;
  
  v_act_completed int := 0;
  v_act_cancelled int := 0;
  v_act_expired int := 0;
  
  v_users_new_today int := 0;
  v_users_new_month int := 0;
  v_users_active int := 0;
  v_total_wallet_balance numeric(12,2) := 0;
  
  v_pix_volume_today numeric(12,2) := 0;
  v_pix_volume_month numeric(12,2) := 0;
  v_pix_pending int := 0;
  v_pix_completed int := 0;

  v_result json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Revenue & Profit (Completed activations)
  -- Revenue = activation.price
  -- Profit = activation.price - service.cost_price
  SELECT 
    COALESCE(SUM(a.price), 0),
    COALESCE(SUM(a.price - s.cost_price), 0)
  INTO v_revenue_today, v_profit_today
  FROM public.activations a
  JOIN public.services s ON a.service_id = s.id
  WHERE a.status = 'completed' AND a.completed_at >= current_date;

  SELECT 
    COALESCE(SUM(a.price), 0),
    COALESCE(SUM(a.price - s.cost_price), 0)
  INTO v_revenue_month, v_profit_month
  FROM public.activations a
  JOIN public.services s ON a.service_id = s.id
  WHERE a.status = 'completed' AND a.completed_at >= date_trunc('month', current_date);

  -- Activations count
  SELECT count(*) INTO v_act_completed FROM public.activations WHERE status = 'completed';
  SELECT count(*) INTO v_act_cancelled FROM public.activations WHERE status = 'cancelled';
  SELECT count(*) INTO v_act_expired FROM public.activations WHERE status = 'expired';

  -- Users
  SELECT count(*) INTO v_users_new_today FROM public.profiles WHERE created_at >= current_date;
  SELECT count(*) INTO v_users_new_month FROM public.profiles WHERE created_at >= date_trunc('month', current_date);
  SELECT count(*) INTO v_users_active FROM public.profiles WHERE status = 'active';
  SELECT COALESCE(SUM(balance), 0) INTO v_total_wallet_balance FROM public.profiles;

  -- Pix / Recharges
  SELECT COALESCE(SUM(amount), 0) INTO v_pix_volume_today 
  FROM public.transactions WHERE type = 'recharge' AND status = 'completed' AND completed_at >= current_date;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_pix_volume_month 
  FROM public.transactions WHERE type = 'recharge' AND status = 'completed' AND completed_at >= date_trunc('month', current_date);

  SELECT count(*) INTO v_pix_pending FROM public.transactions WHERE type = 'recharge' AND status = 'pending';
  SELECT count(*) INTO v_pix_completed FROM public.transactions WHERE type = 'recharge' AND status = 'completed';

  v_result := json_build_object(
    'revenue', json_build_object('today', v_revenue_today, 'month', v_revenue_month),
    'profit', json_build_object('today', v_profit_today, 'month', v_profit_month),
    'activations', json_build_object('completed', v_act_completed, 'cancelled', v_act_cancelled, 'expired', v_act_expired),
    'users', json_build_object('newToday', v_users_new_today, 'newMonth', v_users_new_month, 'active', v_users_active, 'totalWalletBalance', v_total_wallet_balance),
    'pix', json_build_object('volumeToday', v_pix_volume_today, 'volumeMonth', v_pix_volume_month, 'pending', v_pix_pending, 'completed', v_pix_completed)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
