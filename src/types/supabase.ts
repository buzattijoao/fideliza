// src/types/supabase.ts
export interface EmpresaRow {
  id: string;
  nome: string;
  slug: string;
  dona_nome: string;
  dona_email: string;
  senha: string;
  plano_id: string;
  ativa: boolean;
  criado_em: string;
}
