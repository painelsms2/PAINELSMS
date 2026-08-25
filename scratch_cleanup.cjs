const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { data: services } = await supabase.from('services').select('id, active, icon_file');
  const { data: offers } = await supabase.from('service_offers').select('id, service_id, provider_id');
  
  const duplicates = services.filter(s => s.active === false);
  const originals = services.filter(s => s.active === true);
  
  console.log(`Found ${duplicates.length} inactive services.`);
  
  let mergedCount = 0;

  for (const dup of duplicates) {
    const dupPrefix = dup.icon_file ? dup.icon_file.replace(/0\.png$|\.png$/, '') : dup.id;
    const real = originals.find(s => {
      const realPrefix = s.icon_file ? s.icon_file.replace(/0\.png$|\.png$/, '') : s.id;
      return realPrefix === dupPrefix && s.id !== dup.id;
    });

    if (real) {
      console.log(`Merging ${dup.id} into ${real.id}`);
      await supabase.from('service_offers').update({ service_id: real.id }).eq('service_id', dup.id);
      await supabase.from('services').delete().eq('id', dup.id);
      mergedCount++;
    }
  }
  console.log(`Merged ${mergedCount} duplicates.`);
}

cleanup();
