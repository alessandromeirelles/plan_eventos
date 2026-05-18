
import React, { useState, useEffect, useMemo } from 'react';
import { EventStatus, InvoiceStatus } from '../types';
import type { PlanEvent, Company, ViewState, User } from '../types';
import Logo from '../components/Logo';
import TrialWarningModal from '../components/TrialWarningModal';

import { getTodayString } from '../utils';

interface Props {
  events: PlanEvent[];
  companies: Company[];
  onNavigate: (view: ViewState) => void;
  trialDaysLeft: number;
  user?: User | null;
  showValues: boolean;
  setShowValues: (show: boolean) => void;
}

interface HistoryItem {
  id: string;
  eventId: string;
  type: 'CREATED' | 'PAID' | 'INVOICE_ISSUED';
  date: string;
  event: PlanEvent;
}

const Dashboard: React.FC<Props> = ({ events, companies, onNavigate, trialDaysLeft, user, showValues, setShowValues }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [todayEvents, setTodayEvents] = useState<PlanEvent[]>([]);
  const [notifUpcomingEvents, setNotifUpcomingEvents] = useState<PlanEvent[]>([]);
  const [showDailyAlert, setShowDailyAlert] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState<PlanEvent[]>([]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  }, [currentDate]);

  const isGracePeriod = useMemo(() => {
    return user?.subscription_status === 'trial' && trialDaysLeft === 0;
  }, [user?.subscription_status, trialDaysLeft]);

  const showWarningModal = useMemo(() => {
      // Show if expired/grace period, or close to expiry (e.g. < 5 days)
      return isGracePeriod || (user?.subscription_status === 'trial' && trialDaysLeft <= 5);
  }, [isGracePeriod, user?.subscription_status, trialDaysLeft]);


  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  useEffect(() => {
    const today = getTodayString();
    
    // Calculate date 7 days from now
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekString = nextWeekDate.toISOString().split('T')[0];

    const todayFiltered = events.filter(e => e.date === today);
    const upcomingFiltered = events.filter(e => e.date > today && e.date <= nextWeekString).sort((a, b) => a.date.localeCompare(b.date));
    
    setTodayEvents(todayFiltered);
    setNotifUpcomingEvents(upcomingFiltered);

    if (todayFiltered.length > 0) {
      const lastNotified = localStorage.getItem('lastNotifiedDate');
      if (lastNotified !== today) {
        // Show the custom modal alert
        setShowDailyAlert(true);
        
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
                body: `Você tem ${todayFiltered.length} evento(s) hoje!`,
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

  const now = new Date();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearStr = now.getFullYear().toString();
  const monthPrefix = `${currentYearStr}-${currentMonthStr}`;

  const eventsThisMonth = events.filter(e => 
    e.date.startsWith(monthPrefix)
  );

  const totalEventsCount = eventsThisMonth.length;
  const totalValueThisMonth = eventsThisMonth.reduce((acc, curr) => acc + curr.value, 0);

  const getCompanyLogo = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.logo_url;
  };

  const getCompanyIcon = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.icon || 'corporate_fare';
  };

  const todayStr = getTodayString();
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const historyItems: HistoryItem[] = [];
  events.forEach(event => {
    if (event.created_at) {
      historyItems.push({
        id: `${event.id}-created`,
        eventId: event.id,
        type: 'CREATED',
        date: event.created_at,
        event
      });
    } else {
      const match = event.id.match(/EV-(\d+)/);
      if (match) {
        const timestamp = parseInt(match[1]);
        if (!isNaN(timestamp)) {
          historyItems.push({
            id: `${event.id}-created`,
            eventId: event.id,
            type: 'CREATED',
            date: new Date(timestamp).toISOString(),
            event
          });
        }
      }
    }

    if (event.paid_at) {
      historyItems.push({
        id: `${event.id}-paid`,
        eventId: event.id,
        type: 'PAID',
        date: event.paid_at,
        event
      });
    }

    if (event.invoice_issued_at) {
      historyItems.push({
        id: `${event.id}-invoice`,
        eventId: event.id,
        type: 'INVOICE_ISSUED',
        date: event.invoice_issued_at,
        event
      });
    }
  });

  historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentHistory = historyItems.slice(0, 5);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    return `${diffDays}d atrás`;
  };

  const handleConnectGoogleCalendar = async () => {
    if (!user?.uid) return;
    setIsConnecting(true);
    try {
      const urlObj = new URL(window.location.origin);
      // Remove 'www.' from hostname if present and construct origin manually
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const redirectUri = `${urlObj.protocol}//${hostname}/api/auth/google/callback`;
      console.log('[Google Auth] Initiating connection', { userId: user.uid, redirectUri });
      
      const response = await fetch(`/api/auth/google/url?userId=${user.uid}&redirectUri=${encodeURIComponent(redirectUri)}`);
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get auth URL');
        } else {
          const text = await response.text();
          console.error('[Google Auth] Non-JSON error response:', text);
          throw new Error(`Erro do servidor (${response.status}): O servidor não retornou JSON. Verifique se o GOOGLE_CLIENT_ID está configurado corretamente.`);
        }
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Google Auth] Expected JSON but got:', text);
        throw new Error('O servidor retornou uma resposta inválida (não é JSON).');
      }

      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'google_oauth',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Por favor, permita popups para conectar sua agenda do Google.');
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      alert(`Erro ao iniciar conexão: ${error.message}\n\nCertifique-se de que o GOOGLE_CLIENT_ID está configurado no servidor.`);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        alert('Google Calendar conectado com sucesso!');
        window.location.reload();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setIsConnecting(false);
        const errorMsg = event.data.error || 'Erro desconhecido';
        console.error('[Google Auth] Error from popup:', errorMsg);
        if (errorMsg.includes('redirect_uri_mismatch')) {
          alert('Erro de Configuração (redirect_uri_mismatch):\nA URL de redirecionamento não está autorizada no Console do Google Cloud.\n\nPor favor, adicione esta URL aos "URIs de redirecionamento autorizados":\n' + window.location.origin + '/api/auth/google/callback');
        } else {
          alert(`Erro na conexão: ${errorMsg}`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Auto-prompt calendar connection if user is logged in and not connected
    if (user && !user.google_calendar_connected && !sessionStorage.getItem('calendar_prompted')) {
      sessionStorage.setItem('calendar_prompted', 'true');
      setTimeout(handleConnectGoogleCalendar, 1000);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  return (
    <div className="pb-32 animate-in fade-in duration-700 relative">
      {showWarningModal && (
          <TrialWarningModal daysLeft={isGracePeriod ? 7 : 5 - trialDaysLeft} isGracePeriod={isGracePeriod} onSubscribe={() => onNavigate('CHECKOUT')} />
      )}
      {showDailyAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="size-24 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mb-6 relative">
              <span className="material-symbols-outlined text-6xl animate-bounce">notifications_active</span>
              <div className="absolute -top-1 -right-1 size-8 bg-brand-orange text-white rounded-full flex items-center justify-center text-sm font-black border-4 border-white dark:border-slate-900">
                {todayEvents.length}
              </div>
            </div>
            <h3 className="text-2xl font-black text-brand-navy dark:text-white mb-2 uppercase tracking-tight">Eventos de Hoje!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              Você tem <span className="text-brand-orange font-black">{todayEvents.length}</span> compromisso(s) agendado(s) para hoje.
            </p>
            
            <div className="w-full space-y-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {todayEvents.map(e => (
                <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                  <p className="text-sm font-black text-brand-navy dark:text-white truncate">{e.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {e.location || 'Local a definir'}
                  </p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setShowDailyAlert(false);
                if ('Notification' in window && Notification.permission === 'default') {
                  requestNotificationPermission();
                }
              }}
              className="w-full bg-brand-navy dark:bg-white dark:text-brand-navy text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-brand-navy/20"
            >
              ENTENDI, VAMOS LÁ!
            </button>
          </div>
        </div>
      )}

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
            <span className={`material-symbols-outlined text-brand-navy dark:text-slate-400 ${(todayEvents.length > 0 || notifUpcomingEvents.length > 0) ? 'animate-[swing_2s_ease-in-out_infinite]' : ''}`}>notifications</span>
            {(todayEvents.length > 0 || notifUpcomingEvents.length > 0) && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-brand-orange border-2 border-white dark:border-background-dark rounded-full flex items-center justify-center text-[8px] font-black text-white">
                {todayEvents.length + notifUpcomingEvents.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 z-50 animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
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
              
              <div className="space-y-4">
                {todayEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-brand-orange uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">today</span>
                      Hoje ({todayEvents.length})
                    </p>
                    <div className="space-y-2">
                      {todayEvents.map(e => (
                        <div key={e.id} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          <p className="text-sm font-bold text-brand-navy dark:text-white truncate">{e.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{e.location || 'Local a definir'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {notifUpcomingEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-brand-navy dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">event_upcoming</span>
                      Próximos 7 dias ({notifUpcomingEvents.length})
                    </p>
                    <div className="space-y-2">
                      {notifUpcomingEvents.map(e => {
                        const eventDate = new Date(e.date + 'T12:00:00');
                        const dateStr = eventDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                        return (
                          <div key={e.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-brand-navy dark:text-white truncate">{e.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{e.location || 'Local a definir'}</p>
                            </div>
                            <div className="text-[10px] font-bold text-brand-navy dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-sm ml-2 shrink-0">
                              {dateStr}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {todayEvents.length === 0 && notifUpcomingEvents.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Nenhum evento para os próximos dias.</p>
                )}
              </div>
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
              <button 
                onClick={() => setShowValues(!showValues)}
                className="ml-auto p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
              >
                <span className="material-symbols-outlined text-sm">
                  {showValues ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navy text-white shadow-lg">
                <span className="material-symbols-outlined text-sm text-brand-orange animate-pulse">
                  {user?.subscription_status === 'active' ? 'verified' : user?.subscription_status === 'expired' ? 'error' : 'lock_clock'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {user?.subscription_status === 'active' 
                    ? `${trialDaysLeft} dias para renovação` 
                    : user?.subscription_status === 'expired'
                      ? 'Assinatura Expirada'
                      : `${trialDaysLeft} dias de licença`}
                </span>
              </div>
              {user?.subscription_status !== 'active' && (
                <button 
                  onClick={() => onNavigate('CHECKOUT')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange text-white shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Assinar Agora</span>
                </button>
              )}
              
              <div className="flex flex-col gap-1">
                {!user?.google_calendar_connected ? (
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={handleConnectGoogleCalendar}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-brand-orange text-brand-orange shadow-lg hover:bg-brand-orange hover:text-white transition-all active:scale-95"
                    >
                      {isConnecting ? (
                        <div className="size-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="Google Calendar" className="w-4 h-4" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest">{isConnecting ? 'Conectando...' : 'Conectar Agenda'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 shadow-sm">
                      <div className="relative">
                        <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="Google Calendar" className="w-4 h-4 opacity-50" />
                        <span className="material-symbols-outlined text-[10px] absolute -top-1 -right-1 bg-green-500 text-white rounded-full">check</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Agenda Conectada</span>
                    </div>
                  <button 
                      onClick={async () => {
                        window.location.href = '/api/admin/backup';
                      }}
                      className="mt-1 text-[9px] font-bold text-slate-500 hover:text-slate-700 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">download</span>
                      Backup dos Dados
                    </button>
                    <button 
                      onClick={async () => {
                        if (!user?.uid) return;
                        try {
                          const res = await fetch('/api/calendar/sync-all', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.uid })
                          });
                          
                          if (!res.ok) {
                            const text = await res.text();
                            console.error('Server response:', text);
                            throw new Error(`Erro ${res.status}: ${res.statusText}`);
                          }
                          
                          const data = await res.json();
                          if (data.success) {
                            alert(`${data.syncedCount} eventos sincronizados com sucesso!`);
                          } else {
                            throw new Error(data.error || 'Erro desconhecido ao sincronizar');
                          }
                        } catch (err: any) {
                          alert('Erro ao sincronizar eventos: ' + err.message);
                        }
                      }}
                      className="mt-1 text-[9px] font-bold text-brand-orange hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">sync</span>
                      Sincronizar eventos existentes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button onClick={() => onNavigate('SETTINGS')} className="size-20 rounded-full p-1 border-2 border-brand-orange overflow-hidden shadow-xl">
              <img alt="Perfil" className="w-full h-full rounded-full object-cover" src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=002D56&color=fff`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-4 top-4 text-slate-100 dark:text-slate-800/50">
              <span className="material-symbols-outlined text-5xl">calendar_month</span>
            </div>
            <div className="relative z-10 flex flex-col">
              <span className="text-3xl font-black text-brand-navy dark:text-white">{totalEventsCount}</span>
              <span className="text-[10px] font-bold text-slate-400">Neste mês</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Eventos Total</p>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-orange-50 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-4 top-4 text-orange-50 dark:text-slate-800/50">
              <span className="material-symbols-outlined text-5xl">payments</span>
            </div>
            <div className="relative z-10 flex flex-col">
              <span className="text-2xl font-black text-brand-orange">
                {showValues ? `R$ ${totalValueThisMonth.toLocaleString('pt-BR')}` : 'R$ ••••••'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Neste mês</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total (Mês)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-brand-navy dark:text-white uppercase tracking-tight">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><span className="material-symbols-outlined">chevron_left</span></button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysInMonth.firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth.days }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              
              return (
                <div key={day} className="aspect-square flex items-center justify-center cursor-pointer" onClick={() => {
                  if (dayEvents.length > 0) setSelectedDateEvents(dayEvents);
                }}>
                  <div 
                    className={`size-12 flex items-center justify-center rounded-full border-2 ${dayEvents.length > 0 ? 'border-transparent' : 'border-slate-100 dark:border-slate-800'}`}
                    style={{ backgroundColor: dayEvents.length > 0 ? 'transparent' : 'transparent' }}
                  >
                    {dayEvents.length > 0 ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {dayEvents.slice(0, 4).map((e, idx) => {
                          const company = companies.find(c => c.id === e.company_id);
                          return (
                            <div key={e.id} className="size-9 rounded-full overflow-hidden border border-white dark:border-slate-900">
                              {company?.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center text-[14px] text-white font-black" style={{ backgroundColor: company?.color || '#F27D26' }}>
                                  {company?.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm font-black text-slate-600 dark:text-slate-300">{day}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDateEvents.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300" onClick={() => setSelectedDateEvents([])}>
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-brand-navy dark:text-white uppercase tracking-tight">Eventos</h3>
                <button onClick={() => setSelectedDateEvents([])} className="text-slate-400 hover:text-brand-navy dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {selectedDateEvents.map(e => (
                  <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-brand-navy dark:text-white">{e.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status: {e.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-extrabold text-brand-navy dark:text-white tracking-tight">Agenda Próxima</h2>
            <button onClick={() => onNavigate('EVENTS')} className="text-xs font-bold text-brand-orange uppercase tracking-widest hover:underline">Ver Todos</button>
          </div>
          {upcomingEvents.slice(0, 4).map((event) => {
            const logoUrl = getCompanyLogo(event.company_id);
            const totalExpenses = (event.expenses || []).reduce((acc, exp) => acc + (exp.value || 0), 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const receiptDate = event.receipt_date ? new Date(event.receipt_date + 'T12:00:00') : null;
            const isLate = event.status !== EventStatus.PAID && receiptDate && today > receiptDate;
            const delayDays = isLate && receiptDate ? Math.ceil((today.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return (
              <div key={event.id} onClick={() => onNavigate('EVENTS')} className={`flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border ${isLate ? 'border-red-500 shadow-red-500/10' : 'border-slate-50 dark:border-slate-800'} shadow-sm cursor-pointer group hover:border-brand-orange/30 transition-all relative overflow-hidden`}>
                {isLate && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" /> : <span className="material-symbols-outlined text-brand-navy/20 text-3xl">{getCompanyIcon(event.company_id)}</span>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{event.title}</h3>
                    {isLate && (
                      <span className="shrink-0 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                        {delayDays}d ATRASADO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{event.type}</span>
                    <span className="text-[10px] font-black text-brand-orange">
                      {showValues ? `R$ ${event.value.toLocaleString('pt-BR')}` : 'R$ •••'}
                    </span>
                    {totalExpenses > 0 && (
                      <span className="text-[10px] font-black text-red-500" title="Total de Despesas">
                        {showValues ? `- R$ ${totalExpenses.toLocaleString('pt-BR')}` : '- R$ •••'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-[10px]">calendar_month</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{event.date.split('-').reverse().join('/')}</span>
                    {event.receipt_date && (
                      <>
                        <span className="mx-1">•</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isLate ? 'text-red-500' : ''}`}>
                          Recebimento: {event.receipt_date.split('-').reverse().join('/')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`material-symbols-outlined ${isLate ? 'text-red-500' : 'text-slate-200'} group-hover:text-brand-orange transition-colors`}>arrow_forward_ios</span>
              </div>
            );
          })}
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum evento futuro</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-10">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-extrabold text-brand-navy dark:text-white tracking-tight">Histórico Recente</h2>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {recentHistory.map((item, index) => {
              const isLast = index === recentHistory.length - 1;
              let icon = '';
              let iconColor = '';
              let title = '';
              let subtitle = '';

              if (item.type === 'CREATED') {
                icon = 'add_circle';
                iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
                title = 'Novo Evento';
                subtitle = item.event.title;
              } else if (item.type === 'PAID') {
                icon = 'check_circle';
                iconColor = 'text-green-500 bg-green-50 dark:bg-green-500/10';
                title = 'Pagamento Recebido';
                subtitle = item.event.title;
              } else if (item.type === 'INVOICE_ISSUED') {
                icon = 'receipt_long';
                iconColor = 'text-brand-orange bg-brand-orange/10';
                title = 'NF Emitida';
                subtitle = item.event.title;
              }

              return (
                <div key={item.id} className={`flex items-center gap-4 p-4 ${!isLast ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                  <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatTimeAgo(item.date)}</span>
                  </div>
                </div>
              );
            })}
            
            {recentHistory.length === 0 && (
              <div className="text-center py-8 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum histórico recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => onNavigate('NEW_EVENT')}
        className="fixed bottom-24 right-6 z-50 size-14 bg-brand-orange text-white rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in duration-300 hover:scale-110 active:scale-90 transition-all md:hidden"
        title="Novo Evento"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
