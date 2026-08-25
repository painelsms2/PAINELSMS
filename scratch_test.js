import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check services
  const { data: services } = await supabase.from('services').select('id, name, icon_file').order('id');
  console.log(`Total services: ${services.length}`);
  
  const { data: offers } = await supabase.from('service_offers').select('id, service_id, provider_id, provider_service_code');
  console.log(`Total offers: ${offers.length}`);
  
  // Find duplicates (e.g. 'whatsapp' and 'wa')
  const waServices = services.filter(s => s.id.includes('wa') || s.name.toLowerCase().includes('wa'));
  console.log("WA related services:", waServices);
  
  const tgServices = services.filter(s => s.id.includes('tg') || s.name.toLowerCase().includes('tele'));
  console.log("TG related services:", tgServices);
}

check();
