
import React, { useState } from 'react';
import { EventStatus, InvoiceStatus } from '../types';
import type { PlanEvent, ViewState, Company } from '../types';
import Logo from '../components/Logo';

import { getTodayString } from '../utils';

interface Props {
  events: PlanEvent[];
  companies: Company[];
  eventTypes: string[];
  onDelete: (id: string) => void;
  onEdit: (event: PlanEvent) => void;
  onNavigate: (view: ViewState) => void;
  onNew: () => void;
  onStatusChange: (id: string, newStatus: EventStatus) => void;
  onInvoiceStatusChange: (id: string, newStatus: InvoiceStatus) => void;
}

const EventList: React.FC<Props> = ({ events, companies, eventTypes, onDelete, onEdit, onNavigate, onNew, onStatusChange, onInvoiceStatusChange }) => {
  const [activeTab, setActiveTab] = useState<'Todos' | EventStatus | 'Empresa'>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredEvents = events.filter(e => {
    const matchStatus = activeTab === 'Todos' || activeTab === 'Empresa' || e.status === activeTab;
    const matchStart = startDate ? e.date >= startDate : true;
    const matchEnd = endDate ? e.date <= endDate : true;
    const matchCompany = selectedCompany ? e.company_id === selectedCompany : true;
    const matchType = selectedEventType ? e.type === selectedEventType : true;
    const matchSearch = searchTerm ? 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase())) : true;
    return matchStatus && matchStart && matchEnd && matchCompany && matchType && matchSearch;
  }).sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.date.localeCompare(b.date);
    } else {
      return b.date.localeCompare(a.date);
    }
  });

  const totalValue = filteredEvents.reduce((acc, curr) => acc + curr.value, 0);

  const now = new Date();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearStr = now.getFullYear().toString();
  const monthPrefix = `${currentYearStr}-${currentMonthStr}`;
  const todayStr = getTodayString();

  const currentMonthEvents = events.filter(e => e.date.startsWith(monthPrefix));
  const currentMonthValue = currentMonthEvents.reduce((acc, curr) => acc + curr.value, 0);
  const currentMonthRealizedCount = currentMonthEvents.filter(e => e.date < todayStr).length;

  const upcomingEvents = events.filter(e => e.date >= todayStr);
  const upcomingEventsCount = upcomingEvents.length;
  const upcomingEventsValue = upcomingEvents.reduce((acc, curr) => acc + curr.value, 0);

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PAID: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case EventStatus.PENDING: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case EventStatus.LATE: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case EventStatus.CANCELED: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getInvoiceColor = (status?: InvoiceStatus) => {
    if (!status) return 'bg-slate-100 text-slate-500';
    if (status === InvoiceStatus.ISSUED) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (status === InvoiceStatus.CANCELED) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="pb-32 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
          </div>
          <button 
            onClick={onNew}
            className="bg-brand-orange text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Novo Evento
          </button>
        </div>
        
        <div className="px-4 pb-4 pt-1">
          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="block w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary dark:text-white"
              placeholder="Buscar eventos ou clientes..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">De</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary dark:text-white" 
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Até</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary dark:text-white" 
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Empresa</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)} 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary dark:text-white"
              >
                <option value="">Todas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo</label>
              <select 
                value={selectedEventType} 
                onChange={e => setSelectedEventType(e.target.value)} 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary dark:text-white"
              >
                <option value="">Todos</option>
                {eventTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {(startDate || endDate || selectedCompany || selectedEventType) && (
              <div className="flex items-end pb-0.5">
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setSelectedCompany(''); setSelectedEventType(''); }} 
                  className="p-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto no-scrollbar">
          {['Todos', EventStatus.PENDING, EventStatus.PAID, EventStatus.LATE, 'Empresa'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Empresa') {
                  onNavigate('COMPANIES');
                } else {
                  setActiveTab(tab as any);
                }
              }}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
            >
              {tab === 'Todos' ? 'Todos' : tab === 'Empresa' ? 'Empresa' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-3 top-3 text-slate-100 dark:text-slate-800/50">
              <span className="material-symbols-outlined text-4xl">payments</span>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total (Mês Atual)</p>
              <h3 className="text-lg font-black text-brand-orange">
                R$ {currentMonthValue.toLocaleString('pt-BR')}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                {currentMonthEvents.length} {currentMonthEvents.length === 1 ? 'evento' : 'eventos'} ({currentMonthRealizedCount} {currentMonthRealizedCount === 1 ? 'realizado' : 'realizados'})
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-3 top-3 text-slate-100 dark:text-slate-800/50">
              <span className="material-symbols-outlined text-4xl">event_upcoming</span>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximos Eventos</p>
              <h3 className="text-lg font-black text-brand-navy dark:text-white">
                {upcomingEventsCount} <span className="text-xs font-bold text-slate-400">agendados</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                R$ {upcomingEventsValue.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {activeTab === 'Todos' ? 'Total Geral' : `Total ${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}`}
            </p>
            <h2 className="text-2xl font-black text-brand-navy dark:text-white">
              R$ {totalValue.toLocaleString('pt-BR')}
            </h2>
          </div>
          <div className={`p-3 rounded-xl ${activeTab === 'Todos' ? 'bg-slate-100 text-slate-400' : getStatusColor(activeTab as EventStatus)}`}>
            <span className="material-symbols-outlined text-2xl">
              {activeTab === EventStatus.PAID ? 'account_balance_wallet' : activeTab === EventStatus.LATE ? 'error' : 'pending_actions'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Lista de Eventos ({filteredEvents.length})</h2>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-xs text-slate-400 flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xs">sort</span>
            Data {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-800 dark:text-white">{event.title}</h3>
                  <span className="text-xs text-slate-500 font-medium">{companies.find(c => c.id === event.company_id)?.name || 'Empresa não encontrada'}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="relative group">
                    <select 
                      value={event.status}
                      onChange={(e) => onStatusChange(event.id, e.target.value as EventStatus)}
                      className={`appearance-none cursor-pointer pl-2 pr-6 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide outline-none border-none shadow-sm ${getStatusColor(event.status)}`}
                    >
                      {Object.values(EventStatus).map(status => (
                        <option key={status} value={status} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className={`material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${
                      event.status === EventStatus.PAID ? 'text-green-700 dark:text-green-400' : 
                      event.status === EventStatus.LATE ? 'text-red-700 dark:text-red-400' : 
                      event.status === EventStatus.CANCELED ? 'text-slate-700 dark:text-slate-400' : 
                      'text-orange-700 dark:text-orange-400'
                    }`}>arrow_drop_down</span>
                  </div>
                  <div className="relative group mt-1">
                    <select 
                      value={event.invoice_status || InvoiceStatus.PENDING}
                      onChange={(e) => onInvoiceStatusChange(event.id, e.target.value as InvoiceStatus)}
                      className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded text-[9px] font-black uppercase tracking-wide outline-none border-none shadow-sm ${getInvoiceColor(event.invoice_status)}`}
                    >
                      {Object.values(InvoiceStatus).map(status => (
                        <option key={status} value={status} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                          NF: {status}
                        </option>
                      ))}
                    </select>
                    <span className={`material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none ${
                      event.invoice_status === InvoiceStatus.ISSUED ? 'text-blue-600 dark:text-blue-400' : 
                      event.invoice_status === InvoiceStatus.CANCELED ? 'text-red-600 dark:text-red-400' : 
                      'text-slate-500 dark:text-slate-400'
                    }`}>arrow_drop_down</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4 flex-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>{event.date.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">business</span>
                  <span className="truncate">{event.location || 'Local a definir'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">category</span>
                  <span>{event.type}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span>R$ {event.value.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-800 mt-auto">
                <button 
                  onClick={() => onEdit(event)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Editar
                </button>
                <button 
                  onClick={() => onDelete(event.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Excluir
                </button>
              </div>
            </div>
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
              <p>Nenhum evento encontrado.</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-24 right-4 z-40">
        <button 
          onClick={onNew}
          className="bg-brand-orange text-white h-14 w-14 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </div>
  );
};

export default EventList;