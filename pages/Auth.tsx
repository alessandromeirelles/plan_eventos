
import React, { useState } from 'react';
import { User } from '../types';
import Logo from '../components/Logo';
import { supabase, getErrorMessage, testSupabaseConnection } from '../supabaseClient';

interface Props {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const Auth: React.FC<Props> = ({ onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          // Test connection to verify tables
          const { success, message } = await testSupabaseConnection();
          if (!success && message.includes('Tabelas não encontradas')) {
            alert("Atenção: Sua conta foi acessada, mas as tabelas do banco de dados não foram encontradas. Peça ao administrador para rodar o script SQL de configuração.");
          }

          const meta = data.user.user_metadata;
          onLogin({
            email: data.user.email || '',
            name: meta?.name || data.user.email?.split('@')[0] || 'Usuário',
            photo: meta?.photo || meta?.avatar_url || '',
            bio: meta?.bio || '',
            company_name: meta?.company_name || '',
            cnpj: meta?.cnpj || '',
            subscription_status: 'trial',
            trial_start_date: data.user.created_at
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        });

        if (authError) throw authError;
        
        if (data.user) {
          alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark flex flex-col p-8 animate-in fade-in duration-500">
      <div className="mt-8 mb-12 flex flex-col items-center text-center">
        <button onClick={onCancel} className="self-start mb-8 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-brand-navy dark:text-white">close</span>
        </button>
        
        <Logo className="h-16 w-auto mb-8" size="lg" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-4">
          {isLogin ? 'Entre para gerenciar sua carreira.' : 'Crie sua conta profissional hoje.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">person</span>
              <input required type="text" placeholder="Nome completo" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">alternate_email</span>
            <input required type="email" placeholder="seu@email.com" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">Sua Senha</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">lock_open</span>
            <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-brand-navy text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6">
          {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
            <><span>{isLogin ? 'Entrar Agora' : 'Finalizar Cadastro'}</span><span className="material-symbols-outlined">arrow_forward</span></>
          )}
        </button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <button onClick={() => { setIsLogin(!isLogin); }} className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline transition-all">
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça Login'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
