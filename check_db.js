import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgwjhwhcpzkonrcfrmvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnd2pod2hjcHprb25yY2ZybXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODc2NDksImV4cCI6MjEwMjQ2MzY0OX0.LQsVKY7BQltzXf8b765WDNMN_ftCq6XprHOx7qHEMgg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .limit(5);
    
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}

check();
