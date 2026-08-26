-- Migration 16_ddd_availability.sql
-- Creates the service_ddd_availability table and the RPC for upserting availability

CREATE TABLE IF NOT EXISTS public.service_ddd_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    ddd VARCHAR(5) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unknown', -- 'available', 'unavailable', 'unknown'
    source VARCHAR(20) NOT NULL, -- 'probe', 'purchase'
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_service_provider_ddd UNIQUE(service_id, provider_id, ddd)
);

-- Enable RLS
ALTER TABLE public.service_ddd_availability ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone so the frontend can display available DDDs
CREATE POLICY "Allow public read access on service_ddd_availability"
    ON public.service_ddd_availability
    FOR SELECT
    USING (true);

-- Allow authenticated users to upsert (via SECURITY DEFINER function)
CREATE OR REPLACE FUNCTION public.upsert_ddd_availability(
    p_service_id TEXT,
    p_provider_id UUID,
    p_ddd VARCHAR,
    p_status VARCHAR,
    p_source VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.service_ddd_availability (service_id, provider_id, ddd, status, source, last_checked_at)
    VALUES (p_service_id, p_provider_id, p_ddd, p_status, p_source, NOW())
    ON CONFLICT (service_id, provider_id, ddd) DO UPDATE SET
        status = EXCLUDED.status,
        source = EXCLUDED.source,
        last_checked_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
