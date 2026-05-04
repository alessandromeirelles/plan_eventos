import React from 'react';

interface Props {
  daysLeft: number;
  isGracePeriod: boolean;
  onSubscribe: () => void;
}

const TrialWarningModal: React.FC<Props> = ({ daysLeft, isGracePeriod, onSubscribe }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="size-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 relative">
          <span className="material-symbols-outlined text-6xl">warning</span>
        </div>
        <h3 className="text-2xl font-black text-brand-navy dark:text-white mb-2 uppercase tracking-tight">
          {isGracePeriod ? 'Período de Teste Expirado!' : 'Atenção!'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
          {isGracePeriod 
            ? `Seu período de teste de 60 dias terminou. Você tem apenas ${daysLeft} dia(s) para assinar ou todo seu histórico será apagado.` 
            : `Faltam ${daysLeft} dias para o fim do seu teste.`}
        </p>
        
        <button 
          onClick={onSubscribe}
          className="w-full bg-brand-orange text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-brand-orange/20"
        >
          ASSINAR AGORA
        </button>
      </div>
    </div>
  );
};

export default TrialWarningModal;
