
import React, { useState } from 'react';
import { EventStatus, InvoiceStatus } from '../types';
import type { PlanEvent, ViewState, Company, Expense } from '../types';
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
  onUpdateEvent: (event: PlanEvent) => void;
  expenseTypes: string[];
  onUpdateExpenseTypes: (types: string[]) => void;
  showValues: boolean;
  setShowValues: (show: boolean) => void;
}

const ExpenseForm: React.FC<{
  event: PlanEvent;
  expenseTypes: string[];
  onUpdateExpenseTypes: (types: string[]) => void;
  onUpdateEvent: (event: PlanEvent) => void;
}> = ({ event, expenseTypes, onUpdateExpenseTypes, onUpdateEvent }) => {
  const [newExpense, setNewExpense] = useState<{type: string, value: string}>({type: '', value: ''});

  return (
    <div className="flex gap-2 mt-2 flex-wrap items-center">
      <button
        onClick={() => {
          if (newExpense.type && !expenseTypes.includes(newExpense.type)) {
             onUpdateExpenseTypes([...expenseTypes, newExpense.type]);
          }
        }}
        className="bg-slate-500 text-white p-1 rounded"
        title="Adicionar novo tipo de despesa"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
      <span className="text-slate-500 font-bold text-sm">+</span>
      <input 
        list={`expense-types-${event.id}`}
        placeholder="Tipo de despesa"
        className="flex-1 text-xs p-1 rounded border dark:bg-slate-700 dark:border-slate-600"
        value={newExpense.type}
        onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}
      />
      <datalist id={`expense-types-${event.id}`}>
        {expenseTypes.map(t => <option key={t} value={t} />)}
      </datalist>
      <input 
        type="number" 
        placeholder="R$" 
        className="w-16 text-xs p-1 rounded border dark:bg-slate-700 dark:border-slate-600"
        value={newExpense.value}
        onChange={(e) => setNewExpense({...newExpense, value: e.target.value})}
      />
      <button 
        onClick={() => {
          if (!newExpense.type || !newExpense.value) return;
          const updatedExpenses = [...(event.expenses || []), { id: Date.now().toString(), type: newExpense.type, value: parseFloat(newExpense.value) }];
          onUpdateEvent({...event, expenses: updatedExpenses});
          setNewExpense({type: '', value: ''});
        }}
        className="bg-brand-orange text-white p-1 rounded"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  );
};

const ExpenseList: React.FC<{
  event: PlanEvent;
  showValues: boolean;
  onUpdateEvent: (event: PlanEvent) => void;
}> = ({ event, showValues, onUpdateEvent }) => {
  return (
    <div className="space-y-1">
      {(event.expenses || []).map((exp, i) => (
        <div key={i} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
          <span>{exp.type}: {showValues ? `R$ ${exp.value.toLocaleString('pt-BR')}` : 'R$ •••'}</span>
          <button 
            onClick={() => {
              const updatedExpenses = (event.expenses || []).filter((_, index) => index !== i);
              onUpdateEvent({...event, expenses: updatedExpenses});
            }} 
            className="text-red-500 hover:text-red-700"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      ))}
    </div>
  );
};

const EventList: React.FC<Props> = ({ events, companies, eventTypes, onDelete, onEdit, onNavigate, onNew, onStatusChange, onInvoiceStatusChange, onUpdateEvent, expenseTypes, onUpdateExpenseTypes, showValues, setShowValues }) => {
  const [activeTab, setActiveTab] = useState<'Todos' | EventStatus | 'Empresa'>('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

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
    if (status === InvoiceStatus.NOT_REQUESTED) return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="pb-32 min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowValues(!showValues)}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
            >
              <span className="material-symbols-outlined text-sm">
                {showValues ? 'visibility' : 'visibility_off'}
              </span>
            </button>
            <button 
              onClick={onNew}
              className="bg-brand-orange text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Novo Evento
            </button>
          </div>
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
                {showValues ? `R$ ${currentMonthValue.toLocaleString('pt-BR')}` : 'R$ ••••••'}
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
                {showValues ? `R$ ${upcomingEventsValue.toLocaleString('pt-BR')}` : 'R$ ••••••'}
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
              {showValues ? `R$ ${totalValue.toLocaleString('pt-BR')}` : 'R$ ••••••'}
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
          {filteredEvents.map(event => {
            const company = companies.find(c => c.id === event.company_id);
            const companyColor = company?.color;
            
            // Generate Google Calendar Link
            const eventDate = new Date(event.date + (event.time ? `T${event.time}:00` : 'T09:00:00'));
            const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // +1 hour
            
            const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
            const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(eventDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent('Empresa: ' + (company?.name || ''))}&location=${encodeURIComponent(event.location || '')}`;

            const totalExpenses = (event.expenses || []).reduce((acc, exp) => acc + (exp.value || 0), 0);

            const getDelayInfo = (receiptDate?: string, status?: EventStatus) => {
              if (status === EventStatus.PAID || !receiptDate) return null;
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadline = new Date(receiptDate);
              deadline.setHours(0, 0, 0, 0);
              const deadlineDate = new Date(receiptDate + 'T12:00:00'); // Use noon to avoid timezone shifts
              
              if (today > deadlineDate) {
                const diffTime = today.getTime() - deadlineDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
              }
              return null;
            };

            const delayDays = getDelayInfo(event.receipt_date, event.status);

            return (
            <div key={event.id} className={`rounded-xl p-4 border shadow-sm transition-all hover:shadow-md flex flex-col relative overflow-hidden ${delayDays ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background-dark animate-pulse-subtle' : ''}`} style={{ backgroundColor: companyColor ? `${companyColor}20` : 'var(--bg-white)', borderColor: delayDays ? '#ef4444' : (companyColor ? `${companyColor}40` : undefined) }}>
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${delayDays ? 'bg-red-500' : ''}`} style={{ backgroundColor: delayDays ? '#ef4444' : (companyColor || '#e2e8f0') }}></div>
              <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-tight">{event.title}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{company?.name || 'Empresa não encontrada'}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {delayDays && (
                    <div className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-bounce-subtle">
                      <span className="material-symbols-outlined text-[10px]">timer</span>
                      {delayDays}d ATRASADO
                    </div>
                  )}
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
                  <div className="mt-1 flex flex-wrap gap-1">
                    {event.invoice_url && (
                      <a 
                        href={event.invoice_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[12px]">download</span>
                        Ver PDF
                      </a>
                    )}
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      id={`invoice-upload-${event.id}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          onUpdateEvent({ ...event, invoice_url: url });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`invoice-upload-${event.id}`}
                      className="flex items-center gap-1 text-[9px] font-black text-slate-500 hover:text-brand-orange cursor-pointer uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">upload_file</span>
                      {event.invoice_url ? 'Alterar' : 'Anexar NF'}
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4 flex-1 pl-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>{event.date.split('-').reverse().join('/')} {event.time ? `- ${event.time}` : ''}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${delayDays ? 'text-red-500' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                  <span>Recebimento: {event.receipt_date ? event.receipt_date.split('-').reverse().join('/') : '--/--/----'}</span>
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
                  <span>{showValues ? `R$ ${event.value.toLocaleString('pt-BR')}` : 'R$ •••'}</span>
                </div>
              </div>

              {/* Expense Management */}
              <div className="mt-2 pl-2">
                <button 
                  onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-orange"
                >
                  <span className="material-symbols-outlined text-sm">{expandedEventId === event.id ? 'expand_less' : 'expand_more'}</span>
                  Despesas
                </button>
                {expandedEventId === event.id && (
                  <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <ExpenseList 
                      event={event} 
                      showValues={showValues} 
                      onUpdateEvent={onUpdateEvent} 
                    />
                    <ExpenseForm 
                      event={event} 
                      expenseTypes={expenseTypes} 
                      onUpdateExpenseTypes={onUpdateExpenseTypes} 
                      onUpdateEvent={onUpdateEvent} 
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50 dark:border-slate-800 mt-auto pl-2">
                <a 
                  href={googleCalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors mr-auto"
                  title="Adicionar ao Google Calendar"
                >
                  <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                  Agenda
                </a>
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
            )
          })}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
              <p>Nenhum evento encontrado.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <button 
        onClick={onNew}
        className="fixed bottom-24 right-6 z-50 size-14 bg-brand-orange text-white rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in duration-300 hover:scale-110 active:scale-90 transition-all md:hidden"
        title="Novo Evento"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default EventList;