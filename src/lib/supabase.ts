import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { connected: false, error: 'Variáveis de ambiente não configuradas' };
    }

    const { data, error } = await supabase.from('companies').select('*').limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: 'Erro de conexão' };
  }
};