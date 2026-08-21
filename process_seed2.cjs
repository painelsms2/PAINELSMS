const fs = require('fs');
const seed = fs.readFileSync('supabase/seed.sql', 'utf8');

let newSeed = seed.replace(/cost_price, sale_price, country, stock, active/g, 'country, active');

newSeed = newSeed.replace(/\(\'([^\']+)\', \'([^\']+)\', \'([^\']+)\', [0-9.]+, [0-9.]+, \'([^\']+)\', [0-9]+, (true|false)\)/g, '(\'$1\', \'$2\', \'$3\', \'$4\', $5)');

newSeed = newSeed.replace(/cost_price = excluded\.cost_price,\n  sale_price = excluded\.sale_price,\n/g, '');

const providersAndOffers = `
--------------------------------------------------------------------------------
-- 1.5 SEED PROVIDERS AND OFFERS
--------------------------------------------------------------------------------

INSERT INTO public.providers (key, name, logo_key, active) VALUES
  ('provider1', 'Fornecedor 1', 'provider1.png', true),
  ('provider2', 'Fornecedor 2', 'provider2.png', true)
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE
  v_p1 uuid;
  v_p2 uuid;
  v_svc record;
BEGIN
  SELECT id INTO v_p1 FROM public.providers WHERE key = 'provider1';
  SELECT id INTO v_p2 FROM public.providers WHERE key = 'provider2';

  FOR v_svc IN SELECT * FROM public.services LOOP
    -- Insert offer for provider 1
    INSERT INTO public.service_offers (service_id, provider_id, cost_price, sale_price, stock, active, is_default)
    VALUES (v_svc.id, v_p1, 0.50, 1.00, 100, true, true)
    ON CONFLICT (service_id, provider_id) DO NOTHING;
    
    -- Insert offer for provider 2 (randomly inactive or active)
    INSERT INTO public.service_offers (service_id, provider_id, cost_price, sale_price, stock, active, is_default)
    VALUES (v_svc.id, v_p2, 0.80, 1.50, 50, true, false)
    ON CONFLICT (service_id, provider_id) DO NOTHING;
  END LOOP;
END $$;
`;

newSeed = newSeed.replace('--------------------------------------------------------------------------------\n-- 2. CREATE ADMIN ACCOUNT', providersAndOffers + '\n--------------------------------------------------------------------------------\n-- 2. CREATE ADMIN ACCOUNT');

fs.writeFileSync('supabase/seed.sql', newSeed);
console.log('Done!');
