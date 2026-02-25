import { createClient } from '@supabase/supabase-js';

const getProxyUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && origin !== 'about:srcdoc') {
      return `${origin}/supabase-api`;
    }
  }
  return 'http://localhost:3000/supabase-api';
};

const isDev = import.meta.env.DEV;
const supabaseUrl = isDev ? getProxyUrl() : 'https://ycgptxnntkjodwqbnwwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZ3B0eG5udGtqb2R3cWJud3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjIwMDgsImV4cCI6MjA4NzUzODAwOH0.VKKAHaPgxmPlk20_FxN2OWrw2hw4d-uF6wiMCP4MkJw';

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
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desativado para evitar problemas de cross-origin em iframes
    storageKey: 'planeventos-auth-token',
    flowType: 'pkce',
    // @ts-ignore - lockType is used internally to disable LockManager
    lockType: 'null',
  }
});

export const getErrorMessage = (error: any) => {
  const message = error?.msg || error?.message || (typeof error === 'string' ? error : '');
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada ou desative a confirmação no painel do Supabase.';
  if (message.includes('Invalid API key')) return 'Erro de autenticação com o Supabase (API Key inválida). Verifique as configurações do projeto.';
  if (message === 'Failed to fetch' || message.includes('Failed to fetch')) {
    return 'Erro de conexão: O navegador bloqueou a requisição. Se você usa BRAVE BROWSER, desative os Shields (ícone do leão). Se usa ADBLOCK, pause-o nesta página.';
  }
  return message || 'Erro ao conectar com o servidor.';
};

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: "Tabelas não encontradas. Execute o script SQL no painel do Supabase." };
      }
      return { success: false, message: `Erro: ${getErrorMessage(error)}` };
    }
    return { success: true, message: "Conectado com sucesso!" };
  } catch (error: any) {
    return { success: false, message: getErrorMessage(error) };
  }
};
