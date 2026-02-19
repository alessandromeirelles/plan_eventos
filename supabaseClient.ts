
import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Você PRECISA substituir o valor abaixo pela 'anon public' key do seu painel Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nhzfvkogolfvjqfwgxle.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9uJEzjyEBS59DBmH_WqhVw_oq4aPIMY'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    
    if (error) {
      // Erro de tabela não encontrada (você precisa rodar o SQL)
      if (error.code === '42P01') {
        return { success: false, message: "Tabelas não encontradas. Rode o script SQL no painel do Supabase." };
      }
      // Outros erros do Supabase
      return { success: false, message: error.message };
    }
    
    return { success: true, message: "Conectado com sucesso!" };
  } catch (error: any) {
    console.error("Erro crítico Supabase:", error);
    if (error.message === 'Failed to fetch') {
      return { 
        success: false, 
        message: "Erro de Rede (Failed to fetch). Verifique se a URL do projeto está correta ou se sua internet possui bloqueios." 
      };
    }
    return { success: false, message: error.message || "Erro desconhecido ao conectar." };
  }
};

export const getErrorMessage = (error: any) => {
  const message = error?.msg || error?.message || (typeof error === 'string' ? error : '');
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail no seu Gerenciador de E-mail.';
  if (message === 'Failed to fetch') return 'Não foi possível contatar o servidor (Erro de Rede).';
  return message || 'Erro ao conectar com o servidor.';
};
