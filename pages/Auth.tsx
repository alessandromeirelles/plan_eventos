
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Logo from '../components/Logo';
import { auth, getErrorMessage } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

interface Props {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const Auth: React.FC<Props> = ({ onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if we are in a password reset flow
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'resetPassword') {
      setIsUpdatingPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // App.tsx handles the redirect via onAuthStateChanged
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isUpdatingPassword) {
        const user = auth.currentUser;
        if (user) {
          await updatePassword(user, password);
          alert("Senha atualizada com sucesso! Agora você pode fazer login.");
          setIsUpdatingPassword(false);
          setIsLogin(true);
          setPassword('');
        } else {
          setError("Usuário não autenticado para atualizar a senha.");
        }
        setLoading(false);
        return;
      }
      
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        try {
          console.log("Tentando login com:", email);
          await signInWithEmailAndPassword(auth, email, password);
          console.log("Login Firebase bem-sucedido!");
        } catch (err: any) {
          console.error("Erro no login Firebase:", err.code, err.message);
          
          // If it's the hardcoded admin and Firebase login fails, we allow it for demo purposes
          if (email === 'admin@admin.com.br' && password === '@Le010313') {
            console.log("Admin bypass ativado.");
            onLogin({
              email: 'admin@admin.com.br',
              name: 'Administrador',
              photo: '',
              bio: '',
              company_name: '',
              cnpj: '',
              subscription_status: 'active',
              trial_start_date: new Date().toISOString(),
              role: 'admin'
            });
            return;
          }
          throw err;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });

        // Notify Admin
        fetch('/api/admin/notify-new-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: name, userEmail: email })
        }).catch(console.error);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
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
          <div className="mb-6 w-full max-w-sm">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold mb-2">
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 w-full max-w-sm p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl text-green-600 dark:text-green-400 text-xs font-bold animate-in zoom-in duration-300">
            {successMessage}
          </div>
        )}

        <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-4">
          {isUpdatingPassword
            ? 'Defina sua nova senha de acesso.'
            : isForgotPassword 
              ? 'Recupere o acesso à sua conta.' 
              : isLogin 
                ? 'Entre para gerenciar sua carreira.' 
                : 'Crie sua conta profissional hoje.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && !isForgotPassword && !isUpdatingPassword && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">person</span>
              <input required type="text" placeholder="Nome completo" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        
        {!isUpdatingPassword && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">alternate_email</span>
              <input required type="email" placeholder="seu@email.com" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        )}

        {(!isForgotPassword || isUpdatingPassword) && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-brand-navy dark:text-slate-400 uppercase tracking-widest ml-1">
                {isUpdatingPassword ? 'Nova Senha' : 'Sua Senha'}
              </label>
              {isLogin && !isUpdatingPassword && (
                <button 
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">lock_open</span>
              <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-orange outline-none transition-all dark:text-white font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
        )}

        <button disabled={loading} type="submit" className="w-full bg-brand-navy text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-6">
          {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
            <>
              <span>
                {isUpdatingPassword
                  ? 'Atualizar Senha'
                  : isForgotPassword 
                    ? 'Enviar Link de Recuperação' 
                    : isLogin 
                      ? 'Entrar Agora' 
                      : 'Finalizar Cadastro'}
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>

        {isLogin && !isForgotPassword && !isUpdatingPassword && (
          <div className="pt-4">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <span className="relative px-4 bg-white dark:bg-background-dark text-[10px] font-black text-slate-400 uppercase tracking-widest">Ou continue com</span>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-brand-navy dark:text-white font-bold py-4 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebase/builtins/pixie/images/google.svg" alt="Google" className="w-5 h-5" />
              <span>Entrar com Google</span>
            </button>
          </div>
        )}
      </form>

      <div className="mt-auto pt-8 text-center space-y-4">
        {isUpdatingPassword ? (
          <button 
            onClick={() => { setIsUpdatingPassword(false); setIsLogin(true); setError(null); }} 
            className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline transition-all"
          >
            Cancelar e Voltar ao Login
          </button>
        ) : isForgotPassword ? (
          <button 
            onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMessage(null); }} 
            className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline transition-all"
          >
            Voltar para o Login
          </button>
        ) : (
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }} 
            className="text-xs font-black text-brand-orange uppercase tracking-widest hover:underline transition-all"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça Login'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
