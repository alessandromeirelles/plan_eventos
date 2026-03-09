
import React, { useState } from 'react';
import { EventStatus, InvoiceStatus } from '../types';
import type { Company, PlanEvent, Expense } from '../types';
import { getTodayString } from '../utils';

const EXPENSE_TYPES = [
  'Alimentação',
  'Transporte',
  'Hospedagem',
  'Equipamentos',
  'Terceiros',
  'Impostos',
  'Outros'
];

interface Props {
  companies: Company[];
  eventTypes: string[];
  onUpdateEventTypes: (newTypes: string[]) => void;
  initialData?: PlanEvent;
  onSave: (event: PlanEvent) => void;
  onCancel: () => void;
  onNewCompany: () => void;
}

const EventForm: React.FC<Props> = ({ companies, eventTypes, onUpdateEventTypes, initialData, onSave, onCancel, onNewCompany }) => {
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState('');
  
  const [formData, setFormData] = useState({
    id: initialData?.id || 'EV-' + Math.floor(1000 + Math.random() * 9000),
    title: initialData?.title || '',
    date: initialData?.date || getTodayString(),
    time: initialData?.time || '',
    type: initialData?.type || (eventTypes[0] || ''),
    company_id: initialData?.company_id || (companies[0]?.id || ''),
    status: initialData?.status || EventStatus.PENDING,
    value: initialData?.value || 0,
    expenses: initialData?.expenses || [],
    location: initialData?.location || '',
    invoice_status: initialData?.invoice_status || InvoiceStatus.PENDING,
    invoice_number: initialData?.invoice_number || ''
  });

  const handleAddExpense = () => {
    setFormData({
      ...formData,
      expenses: [
        ...formData.expenses,
        { id: 'EXP-' + Math.random().toString(36).substr(2, 9), type: EXPENSE_TYPES[0], value: 0 }
      ]
    });
  };

  const handleUpdateExpense = (id: string, field: keyof Expense, value: any) => {
    setFormData({
      ...formData,
      expenses: formData.expenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    });
  };

  const handleRemoveExpense = (id: string) => {
    setFormData({
      ...formData,
      expenses: formData.expenses.filter(exp => exp.id !== id)
    });
  };

  const totalExpenses = formData.expenses.reduce((acc, exp) => acc + (exp.value || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData,
      ...formData
    } as PlanEvent);
  };

  const handleAddType = () => {
    if (newTypeInput.trim() && !eventTypes.includes(newTypeInput.trim())) {
      const updated = [...eventTypes, newTypeInput.trim()];
      onUpdateEventTypes(updated);
      setNewTypeInput('');
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    const updated = eventTypes.filter(t => t !== typeToRemove);
    onUpdateEventTypes(updated);
    if (formData.type === typeToRemove) {
      setFormData({...formData, type: updated[0] || ''});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      {/* Modal de Gerenciamento de Tipos */}
      {isManagingTypes && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Gerenciar Tipos</h3>
              <button onClick={() => setIsManagingTypes(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Novo tipo..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
                />
                <button 
                  onClick={handleAddType}
                  className="bg-primary text-white p-3 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {eventTypes.map(type => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{type}</span>
                    <button 
                      onClick={() => handleRemoveType(type)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setIsManagingTypes(false)}
                className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex h-6 w-full items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark">
          <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {initialData ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <div className="w-8"></div>
        </div>

        <form id="event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-48 no-scrollbar">
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Informações Gerais</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Título do Evento</label>
              <input 
                required
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Casamento João e Maria"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Local do Evento</label>
              <input 
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="Ex: Espaço das Palmeiras"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Horário</label>
                <input 
                  type="time"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Evento</label>
                  <button 
                    type="button"
                    onClick={() => setIsManagingTypes(true)}
                    className="text-primary hover:text-brand-cyan transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  </button>
                </div>
                <select 
                   className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor (R$)</label>
                <input 
                  type="number"
                  required
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                  <button 
                    type="button"
                    onClick={onNewCompany}
                    className="text-brand-orange hover:text-orange-600 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  </button>
                </div>
                <select 
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={formData.company_id}
                  onChange={e => setFormData({...formData, company_id: e.target.value})}
                >
                  <option value="">Selecione um cliente...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Despesas</h2>
              <button 
                type="button"
                onClick={handleAddExpense}
                className="text-primary hover:text-brand-cyan transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span className="text-xs font-bold">Adicionar</span>
              </button>
            </div>
            
            {formData.expenses.length > 0 ? (
              <div className="space-y-3">
                {formData.expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <select
                      className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                      value={expense.type}
                      onChange={e => handleUpdateExpense(expense.id, 'type', e.target.value)}
                    >
                      {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <input
                        type="number"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                        value={expense.value}
                        onChange={e => handleUpdateExpense(expense.id, 'value', Number(e.target.value))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center px-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Total de Despesas:</span>
                  <span className="text-sm font-black text-red-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed">
                <p className="text-xs text-gray-500">Nenhuma despesa cadastrada.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Status do Evento</h2>
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {Object.values(EventStatus).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status})}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.status === status ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Nota Fiscal</h2>
            <div className="space-y-3">
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {Object.values(InvoiceStatus).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, invoice_status: status})}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.invoice_status === status ? 'bg-white dark:bg-gray-700 text-brand-orange shadow-sm' : 'text-gray-500'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Número da NF</label>
                <input 
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  value={formData.invoice_number}
                  onChange={e => setFormData({...formData, invoice_number: e.target.value})}
                  placeholder="Ex: NF-00123"
                  disabled={formData.invoice_status === InvoiceStatus.PENDING}
                />
              </div>
            </div>
          </section>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
            <button 
              type="submit"
              className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Salvar</span>
            </button>
            <button type="button" onClick={onCancel} className="w-full py-3 text-gray-500 font-semibold">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
