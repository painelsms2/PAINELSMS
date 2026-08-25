const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

async function check() {
  const fetch = (await import('node-fetch')).default;
  
  // Get providers
  const provRes = await fetch(`${supabaseUrl}/rest/v1/providers?select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const providers = await provRes.json();
  console.log("Providers:", providers.map(p => ({ id: p.id, name: p.name, key: p.key })));

  // Get offers
  const offRes = await fetch(`${supabaseUrl}/rest/v1/service_offers?select=id,service_id,provider_id,provider_service_code`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const offers = await offRes.json();
  console.log(`Total Offers: ${offers.length}`);
  
  // Aggregate offers by provider
  const provCounts = {};
  offers.forEach(o => {
    provCounts[o.provider_id] = (provCounts[o.provider_id] || 0) + 1;
  });
  console.log("Offers per provider:", provCounts);
  
  // Get services
  const svcRes = await fetch(`${supabaseUrl}/rest/v1/services?select=id,name,icon_file,active`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const services = await svcRes.json();
  console.log(`Total Services: ${services.length}, Active: ${services.filter(s=>s.active).length}, Inactive: ${services.filter(s=>!s.active).length}`);
  
  // Print some inactive services
  console.log("Sample inactive services:", services.filter(s=>!s.active).slice(0, 10));
}

check().catch(console.error);
