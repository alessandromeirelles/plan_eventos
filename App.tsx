
import React, { useState, useEffect } from 'react';
import { ViewState, PlanEvent, Company, EventStatus, User } from './types';
import { MOCK_EVENTS, MOCK_COMPANIES } from './constants';
import { supabase } from './supabaseClient';
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
  const [events, setEvents] = useState<PlanEvent[]>(MOCK_EVENTS);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_EVENT_TYPES);
  const [editingEvent, setEditingEvent] = useState<PlanEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      } else {
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
    setLoading(true);
    try {
      const [eventsRes, companiesRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('companies').select('*').order('name')
      ]);

      if (eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (companiesRes.data) {
        setCompanies(companiesRes.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrialDaysLeft = () => {
    return 30; // Sempre 30 no modo mock
  };

  const handleSaveEvent = async (event: PlanEvent) => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Se o ID for temporário (começa com EV-), removemos para o Supabase gerar um UUID
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
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      alert("Erro ao salvar evento no banco de dados. Verifique se as tabelas existem.");
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
      delete (companyData as any).id; // Deixa o Supabase gerar o ID se for novo

      const { error } = await supabase
        .from('companies')
        .insert(companyData);

      if (error) throw error;
      
      await fetchData();
      setCurrentView('COMPANIES');
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      alert("Erro ao salvar cliente no banco de dados.");
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
