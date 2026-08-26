-- 19_secure_ddd_availability.sql

CREATE OR REPLACE FUNCTION public.upsert_ddd_availability(
    p_service_id TEXT,
    p_provider_id UUID,
    p_ddd VARCHAR,
    p_status VARCHAR,
    p_source VARCHAR
) RETURNS VOID AS $$
BEGIN
    -- MUST BE CALLED BY SERVICE_ROLE (backend) or ADMIN to prevent client abuse
    IF current_setting('request.jwt.claim.role', true) != 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Must be called from secure backend';
    END IF;

    INSERT INTO public.service_ddd_availability (service_id, provider_id, ddd, status, source, last_checked_at)
    VALUES (p_service_id, p_provider_id, p_ddd, p_status, p_source, NOW())
    ON CONFLICT (service_id, provider_id, ddd) DO UPDATE SET
        status = EXCLUDED.status,
        source = EXCLUDED.source,
        last_checked_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
