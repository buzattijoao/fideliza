// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas.'
  );
}

// O cliente padrão já gerencia:
// 1) Incluir anon key nas requests iniciais
// 2) Substituir por JWT após signIn/signUp
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: função de health‑check, não obrigatório
export const checkSupabaseConnection = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1);
  return {
    connected: !error,
    error: error?.message ?? null,
  };
};

// Apenas reexporta, caso você use em outros pontos
export const SUPABASE_URL     = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
