
import React, { useState, useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType, app } from './firebaseConfig';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, or } from 'firebase/firestore';
import type { User, PlanEvent, Company, ViewState } from './types';
import { EventStatus, InvoiceStatus } from './types';

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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>(['Reunião', 'Casamento', 'Aniversário', 'Formatura', 'Corporativo']);
  const [expenseTypes, setExpenseTypes] = useState<string[]>(['Buffet', 'Decoração', 'Som', 'Local', 'Outros']);
  const [editingEvent, setEditingEvent] = useState<PlanEvent | undefined>();
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showValues, setShowValues] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [googleScriptsLoaded, setGoogleScriptsLoaded] = useState(false);
  
  const currentViewRef = useRef(currentView);
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

  useEffect(() => {
    if (!user || user.role === 'admin' || user?.email === 'alessandromeirelles@gmail.com') {
      setTrialDaysLeft(9999);
      return;
    }

    if (user?.trial_start_date) {
      const start = new Date(user.trial_start_date);
      const now = new Date();
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const totalTrialDays = 90;
      const gracePeriodDays = 7;
      
      const daysLeft = Math.max(0, totalTrialDays - diffDays);
      setTrialDaysLeft(daysLeft);

      // Check for expiration/grace period notices
      if (user.subscription_status === 'trial') {
        if (diffDays >= totalTrialDays && diffDays < (totalTrialDays + gracePeriodDays)) {
          // Grace period check
          const graceDaysRemaining = (totalTrialDays + gracePeriodDays) - diffDays;
          if (!user.emails_sent?.includes('grace_period_alert')) {
             fetch('/api/user/notify-trial-expiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, userName: user.name })
             }).catch(console.error);

             updateDoc(doc(db, 'users', user.uid!), {
               emails_sent: [...(user.emails_sent || []), 'grace_period_alert']
             });
          }
        } else if (diffDays >= (totalTrialDays + gracePeriodDays)) {
          // Expired
          updateDoc(doc(db, 'users', user.uid!), { subscription_status: 'expired' });
        }
      }
    }
  }, [user?.trial_start_date, user?.subscription_status, user?.uid, user?.emails_sent, user?.role, user?.email]);

  useEffect(() => {
    initGoogleScripts((isInited) => {
      setGoogleScriptsLoaded(isInited);
    });
  }, []);

  useEffect(() => {
    if (googleScriptsLoaded && user?.google_calendar_connected) {
      import('./googleCalendarService').then(({ getAccessToken }) => {
        getAccessToken(false).catch(console.error);
      });
    }
  }, [googleScriptsLoaded, user?.google_calendar_connected]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoadingAuth(true);
      console.log('Auth state changed:', firebaseUser?.email, firebaseUser?.uid);
      console.log('Firebase Project ID:', app.options.projectId);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User doc found:', userData);
            const userWithCorrectRole = { 
              ...userData, 
              uid: firebaseUser.uid,
              role: firebaseUser.email === 'alessandromeirelles@gmail.com' ? 'admin' : userData.role
            };
            setUser(userWithCorrectRole);
            
            // Also sync back to DB if role was wrong
            if (firebaseUser.email === 'alessandromeirelles@gmail.com' && userData.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
            }

            if (userData.event_types) {
              setEventTypes(userData.event_types);
            }
            if (userData.expense_types) {
              setExpenseTypes(userData.expense_types);
            }
            if (currentViewRef.current === 'LANDING' || currentViewRef.current === 'AUTH') {
               if (userWithCorrectRole.role === 'admin') {
                 setCurrentView('ADMIN_DASHBOARD');
               } else {
                 setCurrentView('DASHBOARD');
               }
            }
          } else {
            console.log('User doc not found, creating new one for:', firebaseUser.email);
            // Create new user
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Usuário',
              photo: firebaseUser.photoURL || '',
              subscription_status: 'trial',
              trial_start_date: new Date().toISOString(),
              event_types: ['Reunião', 'Casamento', 'Aniversário', 'Formatura', 'Corporativo'],
              role: firebaseUser.email === 'alessandromeirelles@gmail.com' ? 'admin' : 'user'
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
            setCurrentView('DASHBOARD');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setCurrentView('LANDING');
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.email || !user?.uid) return;

    console.log('Setting up snapshots for:', user.email, user.uid);

    // Query events where user_id is either their email OR their uid
    const eventsQuery = query(
      collection(db, 'events'), 
      or(
        where('user_id', '==', user.email),
        where('user_id', '==', user.uid)
      )
    );
    
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      console.log(`Received events snapshot: ${snapshot.size} events`);
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlanEvent));
      setEvents(eventsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    const companiesQuery = query(
      collection(db, 'companies'), 
      or(
        where('user_id', '==', user.email),
        where('user_id', '==', user.uid)
      )
    );
    
    const unsubscribeCompanies = onSnapshot(companiesQuery, (snapshot) => {
      console.log(`Received companies snapshot: ${snapshot.size} companies`);
      const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companiesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'companies');
    });

    return () => {
      unsubscribeEvents();
      unsubscribeCompanies();
    };
  }, [user?.email, user?.uid]);

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
    if (!user?.email && !user?.uid) return;
    
    // Save with both identifiers if possible, or prefer UID for better consistency
    const eventData = { 
      ...event, 
      user_id: user.uid || user.email,
      owner_email: user.email // Add this for redundancy
    };
    
    try {
      if (event.id) {
        await setDoc(doc(db, 'events', event.id), eventData as any, { merge: true });
      } else {
        const newDocRef = doc(collection(db, 'events'));
        await setDoc(newDocRef, { ...eventData, id: newDocRef.id });
        
        // Sincronizar com Google Calendar se conectado
        if (user.google_calendar_connected) {
          const { syncEventToGoogle } = await import('./googleCalendarService');
          await syncEventToGoogle({ ...eventData, id: newDocRef.id });
        }
      }
      setCurrentView('EVENTS');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'events');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const handleStatusChange = async (id: string, newStatus: EventStatus) => {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { status: newStatus });
    } else {
      console.warn(`Event ${id} not found, cannot update status.`);
    }
  };

  const handleInvoiceStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    const docRef = doc(db, 'events', id);
    await updateDoc(docRef, { invoice_status: newStatus });
  };

  const handleUpdateEvent = async (event: PlanEvent) => {
    await setDoc(doc(db, 'events', event.id), event as any, { merge: true });
  };

  const handleSaveCompany = async (company: Company) => {
    if (!user?.email && !user?.uid) return;
    
    const companyData = { 
      ...company, 
      user_id: user.uid || user.email 
    };
    
    try {
      if (company.id) {
        await updateDoc(doc(db, 'companies', company.id), companyData as any);
      } else {
        const newDocRef = doc(collection(db, 'companies'));
        await setDoc(newDocRef, { ...companyData, id: newDocRef.id });
      }
      setCurrentView('COMPANIES');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'companies');
    }
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
        return <EventList events={events} companies={companies} eventTypes={eventTypes} onDelete={handleDeleteEvent} onEdit={(e) => { setEditingEvent(e); handleNavigate('EDIT_EVENT'); }} onNavigate={handleNavigate} onNew={() => { setEditingEvent(undefined); handleNavigate('NEW_EVENT'); }} onStatusChange={handleStatusChange} onInvoiceStatusChange={handleInvoiceStatusChange} onUpdateEvent={handleUpdateEvent} expenseTypes={expenseTypes} onUpdateExpenseTypes={async (types) => { setExpenseTypes(types); if (user?.uid) await updateDoc(doc(db, 'users', user.uid), { expense_types: types }); }} showValues={showValues} setShowValues={setShowValues} />;
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
        return <Reports events={events} companies={companies} eventTypes={eventTypes} onNavigate={handleNavigate} showValues={showValues} setShowValues={setShowValues} />;
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
