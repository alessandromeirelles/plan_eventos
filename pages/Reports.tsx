
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import type { PlanEvent, ViewState, Company } from '../types';
import { EventStatus } from '../types';

interface Props {
  events: PlanEvent[];
  companies: Company[];
  eventTypes: string[];
  onNavigate: (view: ViewState) => void;
  showValues: boolean;
  setShowValues: (show: boolean) => void;
}

const Reports: React.FC<Props> = ({ events, companies, eventTypes, onNavigate, showValues, setShowValues }) => {
  const [companyId, setCompanyId] = useState<string>('all');
  const [eventType, setEventType] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesCompany = companyId === 'all' || event.company_id === companyId;
      const matchesType = eventType === 'all' || event.type === eventType;
      const matchesStatus = paymentStatus === 'all' || event.status === paymentStatus;
      return matchesCompany && matchesType && matchesStatus;
    });
  }, [events, companyId, eventType, paymentStatus]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string; revenue: number; count: number; rawDate: Date }> = {};
    
    filteredEvents.forEach(event => {
      const date = new Date(event.date + 'T12:00:00');
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!data[monthKey]) {
        data[monthKey] = { 
          month: monthLabel, 
          revenue: 0, 
          count: 0,
          rawDate: new Date(date.getFullYear(), date.getMonth(), 1)
        };
      }
      
      data[monthKey].revenue += event.value;
      data[monthKey].count += 1;
    });
    
    return Object.values(data).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [filteredEvents]);

  const totalRevenue = filteredEvents.reduce((acc, curr) => acc + curr.value, 0);
  const totalEvents = filteredEvents.length;
  const avgValue = totalEvents > 0 ? totalRevenue / totalEvents : 0;
  
  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return filteredEvents
      .filter(event => {
        const date = new Date(event.date + 'T12:00:00');
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.value, 0);
  }, [filteredEvents]);

  return (
    <div className="pb-32 animate-in fade-in duration-700">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark/95 ios-blur px-4 h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center flex-1">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2 rounded-full text-brand-navy dark:text-slate-400">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="ml-2 text-lg font-black text-brand-navy dark:text-white uppercase tracking-tight">Relatórios</h1>
        </div>
        <div className="flex items-center justify-end flex-1">
          <button 
            onClick={() => setShowValues(!showValues)}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
            title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
          >
            <span className="material-symbols-outlined text-sm">
              {showValues ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </header>

      <div className="p-5 space-y-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-sm font-bold text-brand-navy dark:text-white">
            <option value="all">Todas as Empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-sm font-bold text-brand-navy dark:text-white">
            <option value="all">Todos os Tipos</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-3 text-sm font-bold text-brand-navy dark:text-white">
            <option value="all">Todos os Status</option>
            {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganhos Mês Atual</span>
            </div>
            <p className="text-2xl font-black text-brand-navy dark:text-white">
              {showValues ? `R$ ${currentMonthRevenue.toLocaleString('pt-BR')}` : 'R$ ••••••'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita Total</span>
            </div>
            <p className="text-2xl font-black text-brand-navy dark:text-white">
              {showValues ? `R$ ${totalRevenue.toLocaleString('pt-BR')}` : 'R$ ••••••'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                <span className="material-symbols-outlined">event</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Eventos</span>
            </div>
            <p className="text-2xl font-black text-brand-navy dark:text-white">
              {totalEvents}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</span>
            </div>
            <p className="text-2xl font-black text-brand-navy dark:text-white">
              {showValues ? `R$ ${avgValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'R$ ••••••'}
            </p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-brand-navy dark:text-white tracking-tight">RECEITA MENSAL</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evolução financeira por mês</p>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  hide={!showValues}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: number) => showValues ? [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita'] : ['R$ •••', 'Receita']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#002D56" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events Count Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-brand-navy dark:text-white tracking-tight">VOLUME DE EVENTOS</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantidade de eventos por mês</p>
            </div>
            <div className="size-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#F27D26" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="Eventos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
