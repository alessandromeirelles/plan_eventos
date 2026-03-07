import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

interface Props {
  onLogout: () => void;
  onNavigate: (view: any) => void;
}

const AdminDashboard: React.FC<Props> = ({ onLogout, onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retentionResult, setRetentionResult] = useState<{message: string, isError: boolean} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const loadedUsers = usersSnap.docs.map(doc => {
        const data = doc.data() as User;
        // Default status to active if not set
        if (!data.status) data.status = 'active';
        return { ...data, id: doc.id }; // Add id to update later
      });
      setUsers(loadedUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'deleted') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(users.map(u => (u as any).id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do usuário.");
    }
  };

  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const deletedUsers = users.filter(u => u.status === 'deleted').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark p-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('DASHBOARD')}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
            title="Voltar ao App"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tight">Painel Admin</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gerenciamento de Usuários</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowRetentionModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-brand-cyan text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-cyan/20"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            <span className="hidden sm:inline">Processar Retenção</span>
          </button>
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/backup');
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error + (data.details ? ': ' + data.details : ''));
                }
                
                // If OK, we need to download the blob
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                a.download = `backup-planeventos-${timestamp}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err: any) {
                console.error("Erro no backup:", err);
                alert(err.message || 'Erro ao criar backup.');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-slate-800/20"
          >
            <span className="material-symbols-outlined text-sm">backup</span>
            <span className="hidden sm:inline">Fazer Backup</span>
          </button>
          <button 
            onClick={onLogout}
            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-100 transition-colors"
            title="Sair"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-emerald-500">{activeUsers}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ativos</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-amber-500">{suspendedUsers}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Suspensos</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-red-500">{deletedUsers}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Excluídos</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Todos os Usuários</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando usuários...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((user: any) => (
              <div key={user.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <img src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=002D56&color=fff`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{user.name}</h3>
                      <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    user.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                    user.status === 'suspended' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                    'bg-red-50 text-red-600 dark:bg-red-900/20'
                  }`}>
                    {user.status === 'active' ? 'Ativo' : user.status === 'suspended' ? 'Suspenso' : 'Excluído'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <div>
                    <span className="font-bold uppercase">Inscrição:</span><br/>
                    {user.trial_start_date ? new Date(user.trial_start_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                  <div>
                    <span className="font-bold uppercase">Atividade:</span><br/>
                    {user.last_activity ? new Date(user.last_activity).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>
                  <div>
                    <span className="font-bold uppercase">Pagamento:</span><br/>
                    <span className={user.subscription_status === 'active' ? 'text-emerald-500 font-bold' : ''}>
                      {user.subscription_status === 'active' ? 'Ativo' : user.subscription_status === 'expired' ? 'Expirado' : 'Trial'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold uppercase">Retenção:</span><br/>
                    <span className="text-brand-cyan font-bold">
                      {user.emails_sent?.length || 0} envios
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  {user.status !== 'active' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'active')}
                      className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Habilitar
                    </button>
                  )}
                  {user.status !== 'suspended' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'suspended')}
                      className="flex-1 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Suspender
                    </button>
                  )}
                  {user.status !== 'deleted' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'deleted')}
                      className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhum usuário encontrado.</div>
            )}
          </div>
        )}
      </div>

      {/* Retention Modal */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            {!retentionResult ? (
              <>
                <div className="w-20 h-20 bg-brand-cyan/10 text-brand-cyan rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl">mail</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Processar Retenção?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">
                  Deseja processar os e-mails de retenção para todos os usuários inativos?
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowRetentionModal(false)}
                    disabled={isProcessing}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      setIsProcessing(true);
                      try {
                        const res = await fetch('/api/admin/process-retention', { method: 'POST' });
                        
                        const contentType = res.headers.get("content-type");
                        if (contentType && contentType.indexOf("application/json") !== -1) {
                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data.error + (data.details ? ': ' + data.details : ''));
                          }
                          setRetentionResult({
                            isError: false,
                            message: `Processamento concluído!\nUsuários verificados: ${data.processed}\nE-mails enviados: ${data.sent}`
                          });
                        } else {
                          const text = await res.text();
                          throw new Error(`Servidor retornou um erro inesperado (${res.status}): ${text.substring(0, 100)}...`);
                        }
                      } catch (err: any) {
                        setRetentionResult({
                          isError: true,
                          message: `Erro ao processar retenção: ${err.message}`
                        });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-brand-cyan hover:bg-brand-cyan/90 text-white font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                      "Processar"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${retentionResult.isError ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30'}`}>
                  <span className="material-symbols-outlined text-5xl">
                    {retentionResult.isError ? 'error' : 'check_circle'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                  {retentionResult.isError ? 'Ops!' : 'Sucesso!'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm whitespace-pre-line">
                  {retentionResult.message}
                </p>
                <button 
                  onClick={() => {
                    setShowRetentionModal(false);
                    setRetentionResult(null);
                  }}
                  className="w-full bg-slate-800 dark:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                >
                  Entendi
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
