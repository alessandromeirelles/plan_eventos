
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User, PlanEvent, Company, ViewState } from './types';
import { EventStatus } from './types';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import CompanyList from './pages/CompanyList';
import EventForm from './pages/EventForm';
import CompanyForm from './pages/CompanyForm';
import Settings from './pages/Settings';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import Navigation from './components/Navigation';

import { initGoogleScripts } from './googleCalendarService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(['Reunião', 'Casamento', 'Aniversário', 'Formatura', 'Corporativo']);
  const [editingEvent, setEditingEvent] = useState<PlanEvent | undefined>();
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showValues, setShowValues] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [googleScriptsLoaded, setGoogleScriptsLoaded] = useState(false);

  useEffect(() => {
    if (user?.trial_start_date) {
      const start = new Date(user.trial_start_date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const left = Math.max(0, 7 - diffDays);
      setTrialDaysLeft(left);
    }
  }, [user?.trial_start_date]);

  useEffect(() => {
    initGoogleScripts((isInited) => {
      setGoogleScriptsLoaded(isInited);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser({ ...userData, uid: firebaseUser.uid });
          if (userData.event_types) {
            setEventTypes(userData.event_types);
          }
          if (userData.role === 'admin') {
            setCurrentView('ADMIN_DASHBOARD');
          } else {
            setCurrentView('DASHBOARD');
          }
        } else {
          // Create new user
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Usuário',
            photo: firebaseUser.photoURL || '',
            subscription_status: 'trial',
            trial_start_date: new Date().toISOString(),
            event_types: ['Reunião', 'Casamento', 'Aniversário', 'Formatura', 'Corporativo'],
            role: 'user'
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
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
    if (!user?.email) return;

    const eventsQuery = query(collection(db, 'events'), where('user_id', '==', user.email));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlanEvent));
      setEvents(eventsData);
    });

    const companiesQuery = query(collection(db, 'companies'), where('user_id', '==', user.email));
    const unsubscribeCompanies = onSnapshot(companiesQuery, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companiesData);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeCompanies();
    };
  }, [user?.email]);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    setCurrentView('LANDING');
  };

  const handleSaveEvent = async (event: PlanEvent) => {
    if (!user?.email) return;
    
    const eventData = { ...event, user_id: user.email };
    if (event.id) {
      await updateDoc(doc(db, 'events', event.id), eventData as any);
    } else {
      const newDocRef = doc(collection(db, 'events'));
      await setDoc(newDocRef, { ...eventData, id: newDocRef.id });
    }
    setCurrentView('EVENTS');
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const handleStatusChange = async (id: string, newStatus: EventStatus) => {
    await updateDoc(doc(db, 'events', id), { status: newStatus });
  };

  const handleSaveCompany = async (company: Company) => {
    if (!user?.email) return;
    
    const companyData = { ...company, user_id: user.email };
    if (company.id) {
      await updateDoc(doc(db, 'companies', company.id), companyData as any);
    } else {
      const newDocRef = doc(collection(db, 'companies'));
      await setDoc(newDocRef, { ...companyData, id: newDocRef.id });
    }
    setCurrentView('COMPANIES');
  };

  const handleDeleteCompany = async (id: string) => {
    await deleteDoc(doc(db, 'companies', id));
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!user?.uid) return false;
    try {
      await updateDoc(doc(db, 'users', user.uid), updatedUser as any);
      setUser(updatedUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!auth.currentUser) return false;
    try {
      await updatePassword(auth.currentUser, newPassword);
      return true;
    } catch (e) {
      return false;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'LANDING':
        return <Landing onNavigate={handleNavigate} />;
      case 'AUTH':
        return <Auth onLogin={handleLogin} onCancel={() => handleNavigate('LANDING')} />;
      case 'DASHBOARD':
        return <Dashboard events={events} companies={companies} onNavigate={handleNavigate} trialDaysLeft={trialDaysLeft} user={user} showValues={showValues} setShowValues={setShowValues} />;
      case 'EVENTS':
        return <EventList events={events} companies={companies} eventTypes={eventTypes} onDelete={handleDeleteEvent} onEdit={(e) => { setEditingEvent(e); handleNavigate('EDIT_EVENT'); }} onNavigate={handleNavigate} onNew={() => { setEditingEvent(undefined); handleNavigate('NEW_EVENT'); }} onStatusChange={handleStatusChange} />;
      case 'COMPANIES':
        return <CompanyList companies={companies} events={events} onNavigate={handleNavigate} onNew={() => { setEditingCompany(undefined); handleNavigate('NEW_COMPANY'); }} onEdit={(c) => { setEditingCompany(c); handleNavigate('EDIT_COMPANY'); }} onDelete={handleDeleteCompany} />;
      case 'NEW_EVENT':
      case 'EDIT_EVENT':
        return <EventForm companies={companies} eventTypes={eventTypes} onUpdateEventTypes={async (types) => { setEventTypes(types); if (user?.uid) await updateDoc(doc(db, 'users', user.uid), { event_types: types }); }} initialData={editingEvent} onSave={handleSaveEvent} onCancel={() => handleNavigate('EVENTS')} onNewCompany={() => handleNavigate('NEW_COMPANY')} />;
      case 'NEW_COMPANY':
      case 'EDIT_COMPANY':
        return <CompanyForm initialData={editingCompany} onSave={handleSaveCompany} onCancel={() => handleNavigate('COMPANIES')} />;
      case 'SETTINGS':
        return <Settings user={user!} onUpdateUser={handleUpdateUser} onChangePassword={handleChangePassword} onNavigate={handleNavigate} onSelectPlan={(plan) => { setSelectedPlan(plan); handleNavigate('CHECKOUT'); }} onLogout={handleLogout} onShowSuccess={(msg) => alert(msg)} />;
      case 'CHECKOUT':
        return <Checkout plan={selectedPlan} userId={user?.uid || ''} onSuccess={() => handleNavigate('DASHBOARD')} onCancel={() => handleNavigate('SETTINGS')} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
      case 'REPORTS':
        return <Reports events={events} onNavigate={handleNavigate} showValues={showValues} setShowValues={setShowValues} />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      {renderView()}
      {user && currentView !== 'LANDING' && currentView !== 'AUTH' && (
        <Navigation currentView={currentView} onNavigate={handleNavigate} user={user} />
      )}
    </div>
  );
};

export default App;
