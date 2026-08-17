import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Variáveis de ambiente do Supabase não encontradas (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY). Verifique o arquivo .env.local ou as configurações da Vercel.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
