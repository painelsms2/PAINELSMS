-- supabase/migrations/03_admin_dashboard_charts.sql

-- Drop the old one just to be safe if signatures change
DROP FUNCTION IF EXISTS public.admin_metrics();

CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS json AS $$
DECLARE
  -- Basic counts
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

  -- Secondary KPIs
  v_ticket_medio numeric(12,2) := 0;
  v_margem_media numeric(5,2) := 0;
  v_success_rate numeric(5,2) := 0;
  v_active_services int := 0;

  v_daily_data json;
  v_top_services json;
  v_recent_activity json;
  v_result json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  ---------------------------------------------------------
  -- 1. HERO KPIs (Existing logic but enriched)
  ---------------------------------------------------------
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

  SELECT count(*) INTO v_act_completed FROM public.activations WHERE status = 'completed';
  SELECT count(*) INTO v_act_cancelled FROM public.activations WHERE status = 'cancelled';
  SELECT count(*) INTO v_act_expired FROM public.activations WHERE status = 'expired';

  SELECT count(*) INTO v_users_new_today FROM public.profiles WHERE created_at >= current_date;
  SELECT count(*) INTO v_users_new_month FROM public.profiles WHERE created_at >= date_trunc('month', current_date);
  SELECT count(*) INTO v_users_active FROM public.profiles WHERE status = 'active';
  SELECT COALESCE(SUM(balance), 0) INTO v_total_wallet_balance FROM public.profiles;

  SELECT COALESCE(SUM(amount), 0) INTO v_pix_volume_today 
  FROM public.transactions WHERE type = 'recharge' AND status = 'completed' AND completed_at >= current_date;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_pix_volume_month 
  FROM public.transactions WHERE type = 'recharge' AND status = 'completed' AND completed_at >= date_trunc('month', current_date);

  SELECT count(*) INTO v_pix_pending FROM public.transactions WHERE type = 'recharge' AND status = 'pending';
  SELECT count(*) INTO v_pix_completed FROM public.transactions WHERE type = 'recharge' AND status = 'completed';

  ---------------------------------------------------------
  -- 2. SECONDARY KPIs
  ---------------------------------------------------------
  IF v_act_completed > 0 THEN
    -- Ticket médio (Mês atual)
    SELECT COALESCE(AVG(price), 0) INTO v_ticket_medio 
    FROM public.activations 
    WHERE status = 'completed' AND completed_at >= date_trunc('month', current_date);

    -- Margem Média (%) (Mês atual)
    -- (Profit / Cost) * 100 ou (Profit / Revenue) * 100. Vamos usar Profit/Revenue para margem bruta.
    IF v_revenue_month > 0 THEN
      v_margem_media := (v_profit_month / v_revenue_month) * 100;
    END IF;
  END IF;

  -- Taxa de Sucesso Geral
  IF (v_act_completed + v_act_cancelled + v_act_expired) > 0 THEN
    v_success_rate := (v_act_completed::numeric / (v_act_completed + v_act_cancelled + v_act_expired)::numeric) * 100;
  END IF;

  -- Serviços ativos
  SELECT count(*) INTO v_active_services FROM public.services WHERE active = true;

  ---------------------------------------------------------
  -- 3. DAILY SERIES (Últimos 30 dias)
  ---------------------------------------------------------
  -- Generates a series of the last 30 days and left joins with aggregations
  WITH dates AS (
    SELECT generate_series(
      (current_date - interval '29 days')::date,
      current_date::date,
      interval '1 day'
    )::date as day_date
  ),
  daily_activations AS (
    SELECT 
      a.completed_at::date as day_date,
      SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) as revenue,
      SUM(CASE WHEN a.status = 'completed' THEN (a.price - s.cost_price) ELSE 0 END) as profit,
      COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN a.status = 'expired' THEN 1 END) as expired
    FROM public.activations a
    JOIN public.services s ON a.service_id = s.id
    WHERE a.completed_at >= current_date - interval '29 days'
    GROUP BY 1
  ),
  daily_pix AS (
    SELECT 
      completed_at::date as day_date,
      SUM(amount) as pix_volume
    FROM public.transactions
    WHERE type = 'recharge' AND status = 'completed' AND completed_at >= current_date - interval '29 days'
    GROUP BY 1
  )
  SELECT json_agg(
    json_build_object(
      'date', to_char(d.day_date, 'DD/MM'),
      'revenue', COALESCE(da.revenue, 0),
      'profit', COALESCE(da.profit, 0),
      'completed', COALESCE(da.completed, 0),
      'cancelled', COALESCE(da.cancelled, 0),
      'expired', COALESCE(da.expired, 0),
      'pix_volume', COALESCE(dp.pix_volume, 0)
    ) ORDER BY d.day_date ASC
  ) INTO v_daily_data
  FROM dates d
  LEFT JOIN daily_activations da ON d.day_date = da.day_date
  LEFT JOIN daily_pix dp ON d.day_date = dp.day_date;

  ---------------------------------------------------------
  -- 4. TOP SERVICES (Mês atual)
  ---------------------------------------------------------
  SELECT json_agg(row_to_json(t)) INTO v_top_services
  FROM (
    SELECT 
      s.name,
      s.icon_file as icon,
      count(a.id) as activations,
      SUM(a.price) as revenue,
      SUM(a.price - s.cost_price) as profit
    FROM public.activations a
    JOIN public.services s ON a.service_id = s.id
    WHERE a.status = 'completed' AND a.completed_at >= date_trunc('month', current_date)
    GROUP BY s.id, s.name, s.icon_file
    ORDER BY profit DESC
    LIMIT 5
  ) t;

  ---------------------------------------------------------
  -- 5. RECENT ACTIVITY (Últimas 8 atividades unificadas)
  ---------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_recent_activity
  FROM (
    SELECT 
      id,
      'Ativação' as type,
      (SELECT full_name FROM public.profiles WHERE id = user_id) as user_name,
      price as amount,
      status,
      created_at
    FROM public.activations
    
    UNION ALL
    
    SELECT 
      id,
      CASE WHEN type = 'recharge' THEN 'Recarga Pix' ELSE 'Bônus/Crédito' END as type,
      (SELECT full_name FROM public.profiles WHERE id = user_id) as user_name,
      amount,
      status,
      created_at
    FROM public.transactions
    WHERE type IN ('recharge', 'admin_credit')
    
    ORDER BY created_at DESC
    LIMIT 8
  ) r;


  ---------------------------------------------------------
  -- FINAL ASSEMBLY
  ---------------------------------------------------------
  v_result := json_build_object(
    'kpis', json_build_object(
      'revenue', json_build_object('today', v_revenue_today, 'month', v_revenue_month),
      'profit', json_build_object('today', v_profit_today, 'month', v_profit_month),
      'activations', json_build_object('completed', v_act_completed, 'cancelled', v_act_cancelled, 'expired', v_act_expired),
      'users', json_build_object('newToday', v_users_new_today, 'newMonth', v_users_new_month, 'active', v_users_active, 'totalWalletBalance', v_total_wallet_balance),
      'pix', json_build_object('volumeToday', v_pix_volume_today, 'volumeMonth', v_pix_volume_month, 'pending', v_pix_pending, 'completed', v_pix_completed),
      'secondary', json_build_object(
        'ticketMedio', v_ticket_medio,
        'margemMedia', v_margem_media,
        'successRate', v_success_rate,
        'activeServices', v_active_services
      )
    ),
    'daily', COALESCE(v_daily_data, '[]'::json),
    'topServices', COALESCE(v_top_services, '[]'::json),
    'recentActivity', COALESCE(v_recent_activity, '[]'::json)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
