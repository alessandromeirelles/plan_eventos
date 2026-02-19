import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhzfvkogolfvjqfwgxle.supabase.co';
const supabaseAnonKey = 'sb_publishable_9uJEzjyEBS59DBmH_WqhVw_oq4aPIMY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Iniciando teste de conexão com o Supabase...');
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Conexão falhou: A tabela "companies" não existe. Você precisa rodar o script SQL no painel do Supabase.');
      } else {
        console.log('❌ Conexão falhou com erro:', error.message);
      }
    } else {
      console.log('✅ Conexão bem-sucedida! O banco de dados está respondendo e as tabelas existem.');
    }
  } catch (err: any) {
    console.log('❌ Erro crítico ao conectar:', err.message);
  }
}

testConnection();
