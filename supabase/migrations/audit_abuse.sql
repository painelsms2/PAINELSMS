-- audit_abuse.sql
-- Run this in your Supabase SQL Editor to find all recharges that were marked 'completed'
-- Export the results and cross-reference the IDs with your Asaas Dashboard.

SELECT 
    t.id AS asaas_charge_id,
    t.user_id,
    p.full_name,
    p.email,
    t.amount,
    t.created_at,
    t.completed_at
FROM 
    public.transactions t
JOIN 
    public.profiles p ON t.user_id = p.id
WHERE 
    t.type = 'recharge' 
    AND t.status = 'completed'
    AND t.created_at > NOW() - INTERVAL '30 days'
ORDER BY 
    t.completed_at DESC;
