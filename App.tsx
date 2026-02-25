
import React, { useState, useEffect } from 'react';
import { ViewState, PlanEvent, Company, User } from './types';
import { MOCK_EVENTS, MOCK_COMPANIES } from './constants';
import { supabase, getErrorMessage } from './supabaseClient';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import CompanyList from './pages/CompanyList';
import EventForm from './pages/EventForm';
import CompanyForm from './pages/CompanyForm';
import Checkout from './pages/Checkout';
import Settings from './pages/Settings';

const DEFAULT_EVENT_TYPES = ['Workshop', 'Casamento', 'Corporativo', 'Aniversário', 'Jantar'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_EVENT_TYPES);
  const [editingEvent, setEditingEvent] = useState<PlanEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [successPopup, setSuccessPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [errorPopup, setErrorPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});

  useEffect(() => {
    // Clear large cookies that might cause 413 errors in this environment
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }

    // Check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const u: User = {
          email: session.user.email || '',
          name: meta?.name || session.user.email?.split('@')[0] || 'Usuário',
          photo: meta?.photo || meta?.avatar_url || '',
          bio: meta?.bio || '',
          company_name: meta?.company_name || '',
          cnpj: meta?.cnpj || '',
          subscription_status: 'trial',
          trial_start_date: session.user.created_at
        };
        setUser(u);
        setCurrentView('DASHBOARD');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Supabase Auth Event:", event);
      if (session?.user) {
        console.log("Sessão ativa para:", session.user.email);
        const meta = session.user.user_metadata;
        const u: User = {
          email: session.user.email || '',
          name: meta?.name || session.user.email?.split('@')[0] || 'Usuário',
          photo: meta?.photo || meta?.avatar_url || '',
          bio: meta?.bio || '',
          company_name: meta?.company_name || '',
          cnpj: meta?.cnpj || '',
          subscription_status: 'trial',
          trial_start_date: session.user.created_at
        };
        setUser(u);
      } else {
        console.log("Nenhuma sessão encontrada.");
        setUser(null);
        setCurrentView('LANDING');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setConnectionError(null);
    try {
      console.log("Buscando dados para o usuário...");
      const [eventsRes, companiesRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('companies').select('*').order('name')
      ]);

      if (eventsRes.error) {
        console.error("Erro events:", eventsRes.error);
        throw eventsRes.error;
      }
      if (companiesRes.error) {
        console.error("Erro companies:", companiesRes.error);
        throw companiesRes.error;
      }

      console.log(`Dados carregados: ${eventsRes.data?.length} eventos, ${companiesRes.data?.length} empresas`);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (companiesRes.data) setCompanies(companiesRes.data);
    } catch (error: any) {
      console.error("Erro ao carregar dados [Detalhes]:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      });
      setConnectionError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getTrialDaysLeft = () => {
    return 30;
  };

  const handleSaveEvent = async (event: PlanEvent) => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const isNew = event.id.startsWith('EV-');
      const { id, ...dataToSave } = event;
      
      const eventData = { 
        ...(isNew ? {} : { id }), 
        ...dataToSave, 
        user_id: authUser.id 
      };
      
      const { error } = await supabase
        .from('events')
        .upsert(eventData);

      if (error) throw error;
      
      await fetchData();
      setCurrentView('EVENTS');
      setSuccessPopup({show: true, message: 'Evento salvo com sucesso!'});
    } catch (error: any) {
      console.error("Erro ao salvar evento:", error);
      setErrorPopup({show: true, message: `Erro ao salvar evento: ${getErrorMessage(error)}`});
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (newCompany: Company) => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const companyData = { ...newCompany, user_id: authUser.id };
      delete (companyData as any).id;

      const { error } = await supabase
        .from('companies')
        .insert(companyData);

      if (error) throw error;
      
      await fetchData();
      setCurrentView('COMPANIES');
      setSuccessPopup({show: true, message: 'Cliente adicionado com sucesso!'});
    } catch (error: any) {
      console.error("Erro ao adicionar cliente:", error);
      setErrorPopup({show: true, message: `Erro ao salvar cliente: ${getErrorMessage(error)}`});
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          name: updatedUser.name,
          bio: updatedUser.bio,
          company_name: updatedUser.company_name,
          cnpj: updatedUser.cnpj,
          photo: updatedUser.photo
        }
      });
      if (error) throw error;
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao salvar perfil no Supabase.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm("Excluir este evento?")) {
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        setEvents(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const renderView = () => {
    if (!user && currentView !== 'LANDING' && currentView !== 'AUTH') return <Landing onNavigate={setCurrentView} />;
    
    switch (currentView) {
      case 'LANDING': return <Landing onNavigate={setCurrentView} />;
      case 'AUTH': return <Auth onLogin={(u) => { setUser(u); setCurrentView('DASHBOARD'); }} onCancel={() => setCurrentView('LANDING')} />;
      case 'DASHBOARD': return <Dashboard events={events} companies={companies} onNavigate={setCurrentView} trialDaysLeft={getTrialDaysLeft()} user={user} />;
      case 'EVENTS': return <EventList events={events} onDelete={handleDeleteEvent} onEdit={(e) => { setEditingEvent(e); setCurrentView('EDIT_EVENT'); }} onNavigate={setCurrentView} onNew={() => { setEditingEvent(null); setCurrentView('NEW_EVENT'); }} />;
      case 'COMPANIES': return <CompanyList companies={companies} onNavigate={setCurrentView} onNew={() => setCurrentView('NEW_COMPANY')} />;
      case 'NEW_EVENT':
      case 'EDIT_EVENT': return <EventForm companies={companies} eventTypes={eventTypes} onUpdateEventTypes={setEventTypes} initialData={editingEvent || undefined} onSave={handleSaveEvent} onCancel={() => { setEditingEvent(null); setCurrentView('EVENTS'); }} onNewCompany={() => setCurrentView('NEW_COMPANY')} />;
      case 'NEW_COMPANY': return <CompanyForm onSave={handleAddCompany} onCancel={() => setCurrentView('COMPANIES')} />;
      case 'SETTINGS':
        return user ? (
          <Settings 
            user={user} 
            onUpdateUser={handleUpdateUser} 
            onNavigate={setCurrentView}
            onSelectPlan={setSelectedPlan}
            onLogout={async () => { 
              await supabase.auth.signOut();
              setUser(null); 
              setCurrentView('LANDING'); 
            }} 
          />
        ) : null;
      case 'CHECKOUT': return <Checkout plan={selectedPlan} onSuccess={() => setCurrentView('DASHBOARD')} onCancel={() => setCurrentView('LANDING')} />;
      default: return <Dashboard events={events} companies={companies} onNavigate={setCurrentView} trialDaysLeft={getTrialDaysLeft()} user={user} />;
    }
  };

  const showNavbar = user && !['LANDING', 'AUTH', 'CHECKOUT', 'NEW_EVENT', 'EDIT_EVENT', 'NEW_COMPANY'].includes(currentView);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark max-w-[430px] mx-auto relative shadow-2xl overflow-x-hidden border-x border-primary/10">
      {connectionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[380px] bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined">cloud_off</span>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest">Erro de Conexão</p>
            <p className="text-[10px] font-bold opacity-90 leading-tight">{connectionError}</p>
            <button 
              onClick={() => {
                document.cookie.split(";").forEach(c => {
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                window.location.reload();
              }}
              className="mt-1 text-[9px] underline font-bold opacity-80 hover:opacity-100"
            >
              Limpar Cookies e Recarregar
            </button>
          </div>
          <button onClick={() => setConnectionError(null)} className="p-1 hover:bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {successPopup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Sucesso!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{successPopup.message}</p>
            <button 
              onClick={() => setSuccessPopup({show: false, message: ''})}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
            >
              OK, Continuar
            </button>
          </div>
        </div>
      )}

      {errorPopup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl">error</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ops!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">{errorPopup.message}</p>
            <button 
              onClick={() => setErrorPopup({show: false, message: ''})}
              className="w-full bg-slate-800 dark:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {renderView()}
      {showNavbar && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[430px] bg-white/90 dark:bg-background-dark/90 ios-blur border-t border-primary/10 px-6 pt-3 pb-8 flex justify-between items-center">
          <button onClick={() => setCurrentView('DASHBOARD')} className={`flex flex-col items-center transition-all active:scale-90 ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[28px]">dashboard</span>
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button onClick={() => setCurrentView('COMPANIES')} className={`flex flex-col items-center transition-all active:scale-90 ${currentView === 'COMPANIES' ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[28px]">corporate_fare</span>
            <span className="text-[10px] font-bold">Clientes</span>
          </button>
          <button onClick={() => setCurrentView('EVENTS')} className={`flex flex-col items-center transition-all active:scale-90 ${currentView === 'EVENTS' ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[28px]">calendar_month</span>
            <span className="text-[10px] font-bold">Eventos</span>
          </button>
          <button onClick={() => setCurrentView('SETTINGS')} className={`flex flex-col items-center transition-all active:scale-90 ${currentView === 'SETTINGS' ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[28px]">settings</span>
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
