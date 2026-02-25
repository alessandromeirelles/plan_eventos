
import React, { useState } from 'react';
import { EventStatus, InvoiceStatus } from '../types';
import type { PlanEvent, ViewState } from '../types';

interface Props {
  events: PlanEvent[];
  onDelete: (id: string) => void;
  onEdit: (event: PlanEvent) => void;
  onNavigate: (view: ViewState) => void;
  onNew: () => void;
}

const EventList: React.FC<Props> = ({ events, onDelete, onEdit, onNavigate, onNew }) => {
  const [activeTab, setActiveTab] = useState<'Todos' | EventStatus>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredEvents = events.filter(e => {
    const matchStatus = activeTab === 'Todos' || e.status === activeTab;
    const matchStart = startDate ? e.date >= startDate : true;
    const matchEnd = endDate ? e.date <= endDate : true;
    return matchStatus && matchStart && matchEnd;
  });

  const totalValue = filteredEvents.reduce((acc, curr) => acc + curr.value, 0);

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PAID: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case EventStatus.PENDING: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case EventStatus.LATE: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case EventStatus.CANCELED: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getInvoiceBadge = (status?: InvoiceStatus) => {
    if (!status) return null;
    let color = 'bg-slate-100 text-slate-500';
    if (status === InvoiceStatus.ISSUED) color = 'bg-blue-100 text-blue-600';
    if (status === InvoiceStatus.CANCELED) color = 'bg-red-100 text-red-600';
    
    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${color}`}>
        NF: {status}
      </span>
    );
  };

  return (
    <div className="pb-32 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight dark:text-white">PlanEventos</h1>
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
            {(startDate || endDate) && (
              <div className="flex items-end pb-0.5">
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }} 
                  className="p-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto no-scrollbar">
          {['Todos', EventStatus.PENDING, EventStatus.PAID, EventStatus.LATE].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
            >
              {tab === 'Todos' ? 'Todos' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
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
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">sort</span>
            Data Decrescente
          </div>
        </div>

        <div className="space-y-3">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">#{event.id}</span>
                  <h3 className="font-bold text-slate-800 dark:text-white">{event.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  {/* Fix: replaced event.invoiceStatus with event.invoice_status */}
                  {getInvoiceBadge(event.invoice_status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
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
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-800">
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