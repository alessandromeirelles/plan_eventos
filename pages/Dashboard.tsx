
import React, { useState, useEffect } from 'react';
import { PlanEvent, Company, ViewState, User } from '../types';
import Logo from '../components/Logo';

interface Props {
  events: PlanEvent[];
  companies: Company[];
  onNavigate: (view: ViewState) => void;
  trialDaysLeft: number;
  user?: User | null;
}

const Dashboard: React.FC<Props> = ({ events, companies, onNavigate, trialDaysLeft, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [todayEvents, setTodayEvents] = useState<PlanEvent[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const filtered = events.filter(e => e.date === today);
    setTodayEvents(filtered);

    if (filtered.length > 0) {
      const lastNotified = localStorage.getItem('lastNotifiedDate');
      if (lastNotified !== today) {
        const handleFirstInteraction = () => {
          try {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/chime_bell_ding.ogg');
            audio.play().catch(e => console.log('Audio autoplay blocked:', e));
          } catch (e) {
            console.log('Audio error:', e);
          }

          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('PlanEventos', {
                body: `Você tem ${filtered.length} evento(s) hoje!`,
                icon: '/vite.svg'
              });
            }
          }
          
          localStorage.setItem('lastNotifiedDate', today);
          document.removeEventListener('click', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction);
        return () => document.removeEventListener('click', handleFirstInteraction);
      }
    }
  }, [events]);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert('Notificações ativadas com sucesso!');
        }
      });
    }
  };

  const totalValue = events.reduce((acc, curr) => acc + curr.value, 0);

  const getCompanyLogo = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.logo_url;
  };

  const getCompanyIcon = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.icon || 'corporate_fare';
  };

  return (
    <div className="pb-32 animate-in fade-in duration-700 relative">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark/95 ios-blur px-4 h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="w-10"></div> 
        <div className="flex items-center justify-center relative">
          <Logo className="h-10 w-auto" />
          <div className="absolute -right-4 top-0 flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-10 justify-end relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full relative">
            <span className={`material-symbols-outlined text-brand-navy dark:text-slate-400 ${todayEvents.length > 0 ? 'animate-[swing_2s_ease-in-out_infinite]' : ''}`}>notifications</span>
            {todayEvents.length > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 bg-brand-orange border-2 border-white dark:border-background-dark rounded-full"></span>}
          </button>
          
          {showNotifications && (
            <div className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 z-50 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificações</h3>
                {'Notification' in window && Notification.permission !== 'granted' && (
                  <button 
                    onClick={requestNotificationPermission}
                    className="text-[9px] bg-brand-orange text-white px-2 py-1 rounded-md font-bold uppercase tracking-wider"
                  >
                    Ativar Alertas
                  </button>
                )}
              </div>
              {todayEvents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Você tem {todayEvents.length} evento(s) hoje:</p>
                  {todayEvents.map(e => (
                    <div key={e.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-bold text-brand-navy dark:text-white truncate">{e.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{e.location || 'Local a definir'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Nenhum evento para hoje.</p>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="p-5">
        <div className="flex justify-between items-start mb-10">
          <div className="flex-1 pr-4 pt-2">
            <p className="text-base font-bold text-slate-900 dark:text-white mb-0.5">Olá, {user?.name || 'Admin'}! 👋</p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-6 italic">"{user?.bio || 'Pronto para gerenciar seus eventos hoje?'}"</p>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-brand-navy dark:text-brand-orange text-2xl">dashboard</span>
              <h2 className="text-2xl font-black text-brand-navy dark:text-white tracking-tight">Dashboard</h2>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navy text-white shadow-lg mb-4">
              <span className="material-symbols-outlined text-sm text-brand-orange animate-pulse">lock_clock</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{trialDaysLeft} dias de licença</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button onClick={() => onNavigate('SETTINGS')} className="size-20 rounded-full p-1 border-2 border-brand-orange overflow-hidden shadow-xl">
              <img alt="Perfil" className="w-full h-full rounded-full object-cover" src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=002D56&color=fff`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
            <span className="text-3xl font-black text-brand-navy dark:text-white">{events.length}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jobs Ativos</p>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-orange-50 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
            <span className="text-2xl font-black text-brand-orange">R$ {(totalValue / 1000).toFixed(1)}k</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsão</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-extrabold text-brand-navy dark:text-white tracking-tight">Agenda Próxima</h2>
            <button onClick={() => onNavigate('EVENTS')} className="text-xs font-bold text-brand-orange uppercase tracking-widest hover:underline">Ver Todos</button>
          </div>
          {events.slice(0, 4).map((event) => {
            const logoUrl = getCompanyLogo(event.company_id);
            return (
              <div key={event.id} onClick={() => onNavigate('EVENTS')} className="flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 shadow-sm cursor-pointer group hover:border-brand-orange/30 transition-all">
                <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" /> : <span className="material-symbols-outlined text-brand-navy/20 text-3xl">{getCompanyIcon(event.company_id)}</span>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{event.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{event.type}</span>
                    <span className="text-[10px] font-black text-brand-orange">R$ {event.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-200 group-hover:text-brand-orange transition-colors">arrow_forward_ios</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
