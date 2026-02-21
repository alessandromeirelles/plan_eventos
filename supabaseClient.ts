import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcxtjgewgkkyboyqzhm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3h0amdld2dra3lib3lxemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzU3NTksImV4cCI6MjA4NzIxMTc1OX0.6S-yd0kiqS_ztF-JWBLV99z-RYoqcBSyUi3kIJpZ0W4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getErrorMessage = (error: any) => {
  const message = error?.msg || error?.message || (typeof error === 'string' ? error : '');
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail no seu Gerenciador de E-mail.';
  if (message === 'Failed to fetch') return 'Não foi possível contatar o servidor (Erro de Rede).';
  return message || 'Erro ao conectar com o servidor.';
};

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: "Tabelas não encontradas. Execute o script SQL no painel do Supabase." };
      }
      return { success: false, message: `Erro: ${error.message}` };
    }
    return { success: true, message: "Conectado com sucesso!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro de rede ou configuração." };
  }
};
