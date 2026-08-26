-- Migration: 24_auto_close_tickets
-- Create a security definer function to auto-close tickets older than 24 hours for the current user

CREATE OR REPLACE FUNCTION public.auto_close_expired_tickets()
RETURNS void AS $$
BEGIN
  UPDATE public.support_tickets
  SET 
    status = 'closed',
    updated_at = now()
  WHERE 
    user_id = auth.uid() 
    AND status != 'closed' 
    AND created_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
