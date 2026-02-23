
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcxtjgewgkkyboyqzhm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3h0amdld2dra3lib3lxemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzU3NTksImV4cCI6MjA4NzIxMTc1OX0.6S-yd0kiqS_ztF-JWBLV99z-RYoqcBSyUi3kIJpZ0W4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Verificando registros no banco de dados...');
  try {
    const { count: companyCount, error: companyError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { count: eventCount, error: eventError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (companyError) console.error('Erro ao contar empresas:', companyError.message);
    else console.log(`Total de empresas: ${companyCount}`);

    if (eventError) console.error('Erro ao contar eventos:', eventError.message);
    else console.log(`Total de eventos: ${eventCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Erro fatal:', err);
    process.exit(1);
  }
}

checkData();
