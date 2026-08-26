require('dotenv').config({ path: '.env.local' });
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  try {
    const res = await fetch(url + '/rest/v1/services?select=id,name,active,icon_file', {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
    });
    const data = await res.json();
    if (data.error) { console.error(data.error); return; }
    console.log('Total services:', data.length);
    const active = data.filter(d => d.active);
    console.log('Active services:', active.length);
    const junk = data.filter(s => /^[A-Z0-9_]{2,5}$/.test(s.name) && s.name === s.name.toUpperCase() && (!s.icon_file || s.icon_file.trim() === ''));
    console.log('Junk services:', junk.length);
    
    // Deactivate junk
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || key); // Might not have service_role_key
    // Just printing SQL
    const junkIds = junk.map(j => `'${j.id}'`).join(',');
    console.log(`UPDATE public.services SET active = false WHERE id IN (${junkIds});`);
  } catch (e) {
    console.error(e);
  }
}
run();
