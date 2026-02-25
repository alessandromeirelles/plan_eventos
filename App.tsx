
import React, { useState, useEffect } from 'react';
import { ViewState, PlanEvent, Company, User } from './types';
import { auth, db } from './firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [successPopup, setSuccessPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [errorPopup, setErrorPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [confirmPopup, setConfirmPopup] = useState<{show: boolean, message: string, onConfirm: () => void}>({show: false, message: '', onConfirm: () => {}});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userData: User;
          if (userDocSnap.exists()) {
            userData = userDocSnap.data() as User;
            // Ensure we have the latest photo/name from auth if missing in firestore
            userData.photo = userData.photo || firebaseUser.photoURL || '';
            userData.name = userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';
          } else {
            userData = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              photo: firebaseUser.photoURL || '',
              bio: '',
              company_name: '',
              cnpj: '',
              subscription_status: 'trial',
              trial_start_date: firebaseUser.metadata.creationTime || new Date().toISOString()
            };
            // Save initial data to Firestore
            await setDoc(userDocRef, userData);
          }
          
          setUser(userData);
          setCurrentView('DASHBOARD');
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback if firestore fails
          setUser({
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            photo: firebaseUser.photoURL || '',
            bio: '',
            company_name: '',
            cnpj: '',
            subscription_status: 'trial',
            trial_start_date: firebaseUser.metadata.creationTime || new Date().toISOString()
          });
          setCurrentView('DASHBOARD');
        }
      } else {
        setUser(null);
        setCurrentView('LANDING');
      }
    });

    return () => unsubscribe();
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
      const eventsRef = collection(db, 'events');
      const qEvents = query(eventsRef, where("user_id", "==", user.email));
      const eventsSnap = await getDocs(qEvents);
      const loadedEvents = eventsSnap.docs.map(doc => doc.data() as PlanEvent);
      setEvents(loadedEvents);

      const companiesRef = collection(db, 'companies');
      const qCompanies = query(companiesRef, where("user_id", "==", user.email));
      const companiesSnap = await getDocs(qCompanies);
      const loadedCompanies = companiesSnap.docs.map(doc => doc.data() as Company);
      setCompanies(loadedCompanies);
    } catch (error: any) {
      setConnectionError("Erro ao carregar dados do Firebase.");
      console.error(error);
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
      if (!user) {
        setErrorPopup({show: true, message: 'Sessão expirada. Por favor, faça login novamente.'});
        return;
      }

      const isNew = event.id.startsWith('EV-');
      const eventId = isNew ? `EV-${Date.now()}` : event.id;
      const eventData = { ...event, id: eventId, user_id: user.email };
      
      await setDoc(doc(db, 'events', eventId), eventData);
      
      let updatedEvents;
      if (isNew) {
        updatedEvents = [...events, eventData];
      } else {
        updatedEvents = events.map(e => e.id === event.id ? eventData : e);
      }
      setEvents(updatedEvents);
      
      setCurrentView('EVENTS');
      setSuccessPopup({show: true, message: 'Evento salvo com sucesso!'});
    } catch (error: any) {
      setErrorPopup({show: true, message: `Erro ao salvar evento: ${error.message || error}`});
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (newCompany: Company) => {
    setLoading(true);
    try {
      if (!user) {
        setErrorPopup({show: true, message: 'Sessão expirada. Por favor, faça login novamente.'});
        return;
      }

      const isNew = !newCompany.id || newCompany.id === '';
      const companyId = isNew ? `CO-${Date.now()}` : newCompany.id;
      const companyData = { 
        ...newCompany, 
        id: companyId,
        user_id: user.email 
      };

      await setDoc(doc(db, 'companies', companyId), companyData);

      let updatedCompanies;
      if (isNew) {
        updatedCompanies = [...companies, companyData];
      } else {
        updatedCompanies = companies.map(c => c.id === newCompany.id ? companyData : c);
      }
      setCompanies(updatedCompanies);
      
      setCurrentView('COMPANIES');
      setSuccessPopup({show: true, message: 'Cliente salvo com sucesso!'});
    } catch (error: any) {
      setErrorPopup({show: true, message: `Erro ao salvar cliente: ${error.message || error}`});
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const authUpdate: any = { displayName: updatedUser.name };
        // O Firebase Auth tem limite de tamanho para a photoURL.
        // Se for base64 (data:image...), não enviamos para o Auth, salvamos apenas no Firestore.
        if (updatedUser.photo && !updatedUser.photo.startsWith('data:image')) {
          authUpdate.photoURL = updatedUser.photo;
        }
        await updateProfile(currentUser, authUpdate);
        
        await setDoc(doc(db, 'users', currentUser.uid), updatedUser);
      }
      
      setUser(updatedUser);
      return true;
    } catch (error: any) {
      setErrorPopup({show: true, message: `Erro ao salvar perfil: ${error.message || error}`});
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setConfirmPopup({
      show: true,
      message: "Tem certeza que deseja excluir este evento?",
      onConfirm: async () => {
        setConfirmPopup({show: false, message: '', onConfirm: () => {}});
        setLoading(true);
        try {
          await deleteDoc(doc(db, 'events', id));
          const updatedEvents = events.filter(e => e.id !== id);
          setEvents(updatedEvents);
          setSuccessPopup({show: true, message: 'Evento excluído com sucesso!'});
        } catch (error: any) {
          setErrorPopup({show: true, message: `Erro ao excluir evento: ${error.message || error}`});
          console.error("Erro ao excluir:", error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView('LANDING');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const renderView = () => {
    if (!user && currentView !== 'LANDING' && currentView !== 'AUTH') return <Landing onNavigate={setCurrentView} />;
    
    switch (currentView) {
      case 'LANDING': return <Landing onNavigate={setCurrentView} />;
      case 'AUTH': return <Auth onLogin={handleLogin} onCancel={() => setCurrentView('LANDING')} />;
      case 'DASHBOARD': return <Dashboard events={events} companies={companies} onNavigate={setCurrentView} trialDaysLeft={getTrialDaysLeft()} user={user} />;
      case 'EVENTS': return <EventList events={events} onDelete={handleDeleteEvent} onEdit={(e) => { setEditingEvent(e); setCurrentView('EDIT_EVENT'); }} onNavigate={setCurrentView} onNew={() => { setEditingEvent(null); setCurrentView('NEW_EVENT'); }} />;
      case 'COMPANIES': return <CompanyList companies={companies} onNavigate={setCurrentView} onNew={() => { setEditingCompany(null); setCurrentView('NEW_COMPANY'); }} onEdit={(c) => { setEditingCompany(c); setCurrentView('EDIT_COMPANY'); }} />;
      case 'NEW_EVENT':
      case 'EDIT_EVENT': return <EventForm companies={companies} eventTypes={eventTypes} onUpdateEventTypes={setEventTypes} initialData={editingEvent || undefined} onSave={handleSaveEvent} onCancel={() => { setEditingEvent(null); setCurrentView('EVENTS'); }} onNewCompany={() => setCurrentView('NEW_COMPANY')} />;
      case 'NEW_COMPANY':
      case 'EDIT_COMPANY': return <CompanyForm initialData={editingCompany || undefined} onSave={handleAddCompany} onCancel={() => { setEditingCompany(null); setCurrentView('COMPANIES'); }} />;
      case 'SETTINGS':
        return user ? (
          <Settings 
            user={user} 
            onUpdateUser={handleUpdateUser} 
            onNavigate={setCurrentView}
            onSelectPlan={setSelectedPlan}
            onLogout={handleLogout} 
            onShowSuccess={(message) => setSuccessPopup({show: true, message})}
          />
        ) : null;
      case 'CHECKOUT': return <Checkout plan={selectedPlan} onSuccess={() => setCurrentView('DASHBOARD')} onCancel={() => setCurrentView('LANDING')} />;
      default: return <Dashboard events={events} companies={companies} onNavigate={setCurrentView} trialDaysLeft={getTrialDaysLeft()} user={user} />;
    }
  };

  const showNavbar = user && !['LANDING', 'AUTH', 'CHECKOUT', 'NEW_EVENT', 'EDIT_EVENT', 'NEW_COMPANY', 'EDIT_COMPANY'].includes(currentView);

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

      {confirmPopup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Atenção</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">{confirmPopup.message}</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setConfirmPopup({show: false, message: '', onConfirm: () => {}})}
                className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmPopup.onConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
              >
                Confirmar
              </button>
            </div>
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
