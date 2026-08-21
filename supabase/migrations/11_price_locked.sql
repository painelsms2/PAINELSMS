-- 11_price_locked.sql

ALTER TABLE public.service_offers ADD COLUMN price_locked boolean DEFAULT false;
