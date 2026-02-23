import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcxtjgewgkkyboyqzhm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3h0amdld2dra3lib3lxemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzU3NTksImV4cCI6MjA4NzIxMTc1OX0.6S-yd0kiqS_ztF-JWBLV99z-RYoqcBSyUi3kIJpZ0W4';

// Custom storage to handle quota exceeded errors in restricted environments
const customStorage = {
  getItem: (key: string) => {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Supabase Auth: LocalStorage quota exceeded. Session will be in-memory only.');
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'planeventos-auth-token',
    flowType: 'pkce',
    // @ts-ignore - lockType is used internally to disable LockManager
    lockType: 'null',
  }
});

export const getErrorMessage = (error: any) => {
  const message = error?.msg || error?.message || (typeof error === 'string' ? error : '');
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. (Se você acabou de se cadastrar, verifique se confirmou seu e-mail ou crie uma nova conta).';
  if (message.includes('Email not confirmed')) return 'E-mail não confirmado. Por favor, verifique sua caixa de entrada e a pasta de SPAM para confirmar seu cadastro antes de fazer login.';
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
