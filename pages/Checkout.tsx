
import React, { useState } from 'react';

interface Props {
  plan: 'monthly' | 'yearly';
  onSuccess: (planType: 'monthly' | 'yearly') => void;
  onCancel: () => void;
}

const Checkout: React.FC<Props> = ({ plan, onSuccess, onCancel }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(plan);
  const [method, setMethod] = useState<'CARD' | 'PIX'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const price = selectedPlan === 'monthly' ? '9,90' : '99,90';
  const period = selectedPlan === 'monthly' ? 'mês' : 'ano';

  const handlePayment = () => {
    setIsProcessing(true);
    // Simula processamento de 2 segundos
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(selectedPlan);
    }, 2500);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark animate-in fade-in duration-500">
        <div className="relative size-24 mb-8">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-brand-cyan rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-brand-cyan text-4xl">shield_lock</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">Processando Pagamento</h2>
        <p className="text-slate-500 text-center text-sm font-medium px-8">Estamos validando seus dados em um ambiente 100% criptografado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in slide-in-from-right duration-500">
      <header className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark">
        <button onClick={onCancel} className="text-slate-400">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h1 className="text-lg font-black dark:text-white uppercase tracking-widest">Finalizar Assinatura</h1>
      </header>

      <div className="p-6">
        {/* Escolha de Plano */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Escolha seu Plano</p>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <button 
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${selectedPlan === 'monthly' ? 'bg-white dark:bg-slate-800 text-brand-cyan shadow-sm' : 'text-slate-400'}`}
            >
              Mensal
            </button>
            <button 
              onClick={() => setSelectedPlan('yearly')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${selectedPlan === 'yearly' ? 'bg-white dark:bg-slate-800 text-brand-cyan shadow-sm' : 'text-slate-400'}`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</p>
              <h2 className="text-lg font-black text-brand-cyan uppercase">{selectedPlan === 'monthly' ? 'Mensal Profissional' : 'Anual Premium'}</h2>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 dark:text-white">R$ {price}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">por {period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            PAGAMENTO SEGURO SSL
          </div>
        </div>

        {/* Seleção de Método */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setMethod('CARD')}
            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'CARD' ? 'border-brand-cyan bg-brand-cyan/5' : 'border-slate-100 dark:border-slate-800'}`}
          >
            <span className="material-symbols-outlined">credit_card</span>
            <span className="text-xs font-black uppercase">Cartão</span>
          </button>
          <button 
            onClick={() => setMethod('PIX')}
            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'PIX' ? 'border-brand-cyan bg-brand-cyan/5' : 'border-slate-100 dark:border-slate-800'}`}
          >
            <span className="material-symbols-outlined">pix</span>
            <span className="text-xs font-black uppercase">PIX</span>
          </button>
        </div>

        {method === 'CARD' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Número do Cartão</label>
              <div className="relative">
                <input className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan dark:text-white" placeholder="0000 0000 0000 0000" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                  <div className="w-8 h-5 bg-slate-200 rounded"></div>
                  <div className="w-8 h-5 bg-slate-300 rounded"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Validade</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan dark:text-white" placeholder="MM/AA" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">CVV</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan dark:text-white" placeholder="123" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome no Cartão</label>
              <input className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan dark:text-white uppercase" placeholder="JOÃO D SILVA" />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
             <div className="bg-slate-100 dark:bg-slate-800 size-48 mx-auto rounded-3xl flex items-center justify-center p-4">
                {/* QR Code Simulado */}
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-xl relative overflow-hidden flex flex-wrap p-2">
                   {[...Array(64)].map((_, i) => (
                     <div key={i} className={`size-4 ${Math.random() > 0.5 ? 'bg-slate-900 dark:bg-white' : ''}`}></div>
                   ))}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white p-2 rounded-lg shadow-xl">
                        <span className="material-symbols-outlined text-brand-cyan">pix</span>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-xs text-slate-500 font-medium px-10">Escaneie o QR Code acima no app do seu banco para pagar instantaneamente.</p>
             <button className="flex items-center gap-2 mx-auto text-brand-cyan font-black text-xs uppercase tracking-widest border border-brand-cyan/20 px-4 py-2 rounded-full">
               <span className="material-symbols-outlined text-sm">content_copy</span>
               Copiar Código PIX
             </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={handlePayment}
          className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">lock</span>
          <span>Pagar Agora R$ {price}</span>
        </button>
      </div>
    </div>
  );
};

export default Checkout;
