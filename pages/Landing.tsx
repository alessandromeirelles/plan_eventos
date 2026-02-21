
import React, { useState } from 'react';
import { ViewState } from '../types';
import Logo from '../components/Logo';
import { testSupabaseConnection } from '../supabaseClient';

interface Props {
  onNavigate: (view: ViewState) => void;
}

const Landing: React.FC<Props> = ({ onNavigate }) => {
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const result = await testSupabaseConnection();
    setTestStatus(result);
    setIsTesting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav className="sticky top-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md px-4 py-4 border-b border-slate-100 shadow-sm">
        <Logo className="h-10 w-auto" />
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center px-8 pt-12 pb-20 text-center">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-orange-50 px-5 py-2 text-sm font-bold text-brand-orange border border-brand-orange/10">
          <span className="material-symbols-outlined text-base">photo_camera</span>
          <span>Gestão para Fotógrafos & Freelancers</span>
        </div>

        <h1 className="mb-6 text-[42px] font-black leading-[1.1] tracking-tight text-brand-navy">
          Sua Agenda em um <br /><span className="text-brand-orange">Clique</span> Profissional
        </h1>

        <p className="mb-12 max-w-sm text-lg font-medium leading-relaxed text-slate-500">
          A plataforma inteligente para fotógrafos e videomakers gerenciarem eventos e clientes com automação.
        </p>

        <div className="flex w-full flex-col gap-4">
          <button 
            onClick={() => onNavigate('AUTH')}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand-navy px-6 text-xl font-black text-white shadow-2xl shadow-brand-navy/30 transition-all active:scale-95 hover:brightness-110"
          >
            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            <span>Começar Agora</span>
          </button>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Teste Grátis por 30 dias • Sem Cartão</p>

          <div className="mt-8 pt-8 border-t border-slate-100 w-full">
            <button 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto hover:text-brand-navy transition-colors"
            >
              {isTesting ? (
                <div className="size-3 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-sm">database</span>
              )}
              Verificar Conexão Supabase
            </button>
            
            {testStatus && (
              <div className={`mt-3 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1 ${testStatus.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {testStatus.message}
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-300">Ferramenta Essencial</p>
          <div className="flex gap-8 text-slate-300">
            <span className="material-symbols-outlined text-3xl">camera</span>
            <span className="material-symbols-outlined text-3xl">videocam</span>
            <span className="material-symbols-outlined text-3xl">edit_square</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
