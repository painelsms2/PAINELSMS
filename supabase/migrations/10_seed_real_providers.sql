-- 10_seed_real_providers.sql

INSERT INTO public.providers (key, name, active) VALUES
  ('sms24h', 'SMS24H', true),
  ('numerovirtual', 'Número Virtual', true)
ON CONFLICT (key) DO NOTHING;
