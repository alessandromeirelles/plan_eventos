
import React, { useState } from 'react';
import { Company } from '../types';

interface Props {
  onSave: (company: Company) => void;
  onCancel: () => void;
}

const CompanyForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    contact: '',
    icon: 'corporate_fare',
    logo_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo_url: reader.result as string });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Passamos os dados sem o ID real, o App.tsx cuidará da inserção no banco
    onSave({
      id: '', // Será ignorado pelo backend
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-500">
        <div className="flex h-6 w-full items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark">
          <button onClick={onCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Nova Empresa / Cliente</h1>
          <div className="w-8"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-48 no-scrollbar">
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Identidade Visual (Opcional)</h2>
            
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="size-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {formData.logo_url ? (
                  <img src={formData.logo_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block">
                  <span className="sr-only">Escolher arquivo</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand-cyan/10 file:text-brand-cyan hover:file:bg-brand-cyan/20 cursor-pointer"/>
                </label>
                <p className="text-[10px] text-slate-400 font-medium">Ou cole um link direto de imagem abaixo.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nome da Empresa / Cliente</label>
              <input 
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan outline-none dark:text-white" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Studio Criativo LTDA ou Nome do Cliente" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">URL da Logomarca</label>
              <input 
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan outline-none dark:text-white" 
                value={formData.logo_url} 
                onChange={e => setFormData({...formData, logo_url: e.target.value})} 
                placeholder="https://exemplo.com/foto.jpg" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">CNPJ / CPF</label>
                <input 
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan outline-none dark:text-white" 
                  value={formData.cnpj} 
                  onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                  placeholder="00.000.000/0001-00" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">WhatsApp / Telefone</label>
                <input 
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan outline-none dark:text-white" 
                  value={formData.contact} 
                  onChange={e => setFormData({...formData, contact: e.target.value})} 
                  placeholder="(00) 00000-0000" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Endereço (Opcional)</label>
              <input 
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-cyan outline-none dark:text-white" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="Rua, Número, Cidade - UF" 
              />
            </div>
          </section>
        </form>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <button onClick={handleSubmit} className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-black py-4 rounded-xl shadow-lg shadow-brand-cyan/20 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">add_business</span>
            <span>Salvar Cliente</span>
          </button>
          <button type="button" onClick={onCancel} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Descartar</button>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;
