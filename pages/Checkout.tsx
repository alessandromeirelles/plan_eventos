
import React, { useState } from 'react';

interface Props {
  plan: 'monthly' | 'yearly';
  userId: string;
  onSuccess: (planType: 'monthly' | 'yearly') => void;
  onCancel: () => void;
}

const Checkout: React.FC<Props> = ({ plan, userId, onSuccess, onCancel }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(plan);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const price = selectedPlan === 'monthly' ? '9,90' : '99,90';
  const period = selectedPlan === 'monthly' ? 'mês' : 'ano';

  // Links de Pagamento do PagSeguro
  const PAGSEGURO_LINK_MONTHLY = "https://pag.ae/81xB3HtTJ";
  const PAGSEGURO_LINK_YEARLY = "https://pag.ae/81xB47ZTN";

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Redireciona para o PagSeguro com a referência do usuário
    const baseUrl = selectedPlan === 'monthly' ? PAGSEGURO_LINK_MONTHLY : PAGSEGURO_LINK_YEARLY;
    const paymentLink = `${baseUrl}?reference=${userId}`;
    
    // Abre o PagSeguro em uma janela popup (menor) para não sair do aplicativo
    const width = 500;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      paymentLink, 
      'PagSeguro', 
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes,resizable=yes`
    );
    
    // Se o bloqueador de popups impedir, abre em nova aba
    if (!popup) {
      window.open(paymentLink, '_blank');
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark animate-in fade-in duration-500">
        <div className="relative size-24 mb-8">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-brand-cyan rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-brand-cyan text-4xl">hourglass_empty</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">Aguardando Pagamento...</h2>
        <p className="text-slate-500 text-center text-sm font-medium px-8 mb-6">
          Assim que o PagSeguro confirmar seu pagamento, seu plano será ativado automaticamente. Isso pode levar alguns minutos.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase text-center">ID de Referência</p>
          <p className="text-xs font-mono text-slate-600 dark:text-slate-300 text-center">{userId}</p>
        </div>
        <button 
          onClick={onCancel}
          className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black px-8 py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          Voltar para o Dashboard
        </button>
        <p className="mt-6 text-[10px] text-slate-400 text-center uppercase font-black">Você pode fechar esta tela. O plano será ativado em segundo plano.</p>
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

        {/* Informação PagSeguro */}
        <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined text-brand-cyan text-3xl">lock</span>
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2">Pagamento via PagSeguro</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Você será redirecionado para o ambiente seguro do PagSeguro para finalizar sua compra com Cartão de Crédito, PIX ou Boleto.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 z-50">
        <button 
          onClick={handlePayment}
          className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">shopping_cart_checkout</span>
          <span>Pagar R$ {price} no PagSeguro</span>
        </button>
      </div>
    </div>
  );
};

export default Checkout;
