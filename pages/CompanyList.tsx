
import React from 'react';
import type { Company, ViewState, PlanEvent } from '../types';

import { getTodayString } from '../utils';

interface Props {
  companies: Company[];
  events: PlanEvent[];
  onNavigate: (view: ViewState) => void;
  onNew: () => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
}

const CompanyList: React.FC<Props> = ({ companies, events, onNavigate, onNew, onEdit, onDelete }) => {
  const today = getTodayString();

  const getEventCounts = (companyId: string) => {
    const companyEvents = events.filter(e => e.company_id === companyId);
    const realized = companyEvents.filter(e => e.date < today).length;
    const upcoming = companyEvents.filter(e => e.date >= today).length;
    return { realized, upcoming };
  };
  return (
    <div className="pb-32 bg-gray-50 dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Parceiros e Clientes</p>
          </div>
          <button 
            onClick={onNew}
            className="bg-brand-orange text-white p-2 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input 
            className="w-full bg-white dark:bg-gray-900 border-none rounded-xl py-3 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-brand-cyan text-gray-900 dark:text-white"
            placeholder="Buscar..." 
            type="text"
          />
        </div>
      </div>

      <main className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(company => (
          <div key={company.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: company.color || '#e2e8f0' }}></div>
            <div className="flex justify-between items-start mb-4 pl-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200 dark:border-slate-700">
                  {company.logo_url ? (
                    <img src={company.logo_url} className="w-full h-full object-cover" alt={company.name} onError={(e) => {
                      (e.target as HTMLImageElement).src = ''; // Fallback se o link quebrar
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                  ) : (
                    <span className="material-symbols-outlined text-2xl">{company.icon}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{company.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{company.cnpj}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => onEdit(company)} className="p-2 text-gray-400 hover:text-brand-cyan transition-colors">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button onClick={() => onDelete(company.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
            <div className="space-y-3 border-t border-gray-50 dark:border-gray-800 pt-4 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Realizados</p>
                  <p className="text-xl font-black text-brand-navy dark:text-white">{getEventCounts(company.id).realized}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">A Realizar</p>
                  <p className="text-xl font-black text-brand-orange">{getEventCounts(company.id).upcoming}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="material-symbols-outlined text-gray-400 text-lg">badge</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">{company.responsible || 'Responsável não informado'}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-gray-400 text-lg">person</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{company.contact}</p>
                </div>
                <a 
                  href={company.contact ? `https://wa.me/${company.contact.replace(/\D/g, '').startsWith('55') ? company.contact.replace(/\D/g, '') : '55' + company.contact.replace(/\D/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${company.contact ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed pointer-events-none'}`}
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        ))}
        {companies.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl block mb-2">business</span>
            <p className="text-sm font-bold">Nenhuma empresa cadastrada.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyList;
