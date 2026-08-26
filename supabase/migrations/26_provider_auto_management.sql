-- 26_provider_auto_management.sql
-- Adds provider health tracking + auto markup so offer priority can react
-- to a provider going down instead of relying on a manually set default.

-- 1. Health + pricing columns on providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS consecutive_failures int NOT NULL DEFAULT 0;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_failure_at timestamptz;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_success_at timestamptz;
-- 100 = cost x2, matching the markup the sync already applied
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS auto_markup_percent numeric(6,2) NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_health_status_check'
  ) THEN
    ALTER TABLE public.providers
      ADD CONSTRAINT providers_health_status_check
      CHECK (health_status IN ('healthy', 'unstable'));
  END IF;
END $$;

-- 2. Record the outcome of a real provider call.
-- Called by the backend with the service role key only — never from the client.
-- Failure threshold: 3 consecutive provider-side failures flips to 'unstable'.
-- Any success immediately restores 'healthy', so recovery is automatic.
CREATE OR REPLACE FUNCTION public.record_provider_result(
  p_provider_id uuid,
  p_success boolean
)
RETURNS void AS $$
BEGIN
  IF p_success THEN
    UPDATE public.providers
    SET consecutive_failures = 0,
        last_success_at = now(),
        health_status = 'healthy'
    WHERE id = p_provider_id;
  ELSE
    UPDATE public.providers
    SET consecutive_failures = consecutive_failures + 1,
        last_failure_at = now(),
        health_status = CASE
          WHEN consecutive_failures + 1 >= 3 THEN 'unstable'
          ELSE health_status
        END
    WHERE id = p_provider_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.record_provider_result(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_provider_result(uuid, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.record_provider_result(uuid, boolean) FROM anon;

-- 3. Admin escape hatch: clear a provider's unstable flag by hand.
CREATE OR REPLACE FUNCTION public.admin_reset_provider_health(p_provider_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.providers
  SET health_status = 'healthy',
      consecutive_failures = 0
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
