
import React, { useState } from 'react';
import { User, ViewState } from '../types';

interface Props {
  user: User;
  onUpdateUser: (updatedUser: User) => Promise<boolean>;
  onNavigate: (view: ViewState) => void;
  onSelectPlan: (plan: 'monthly' | 'yearly') => void;
  onLogout: () => void;
  onShowSuccess: (message: string) => void;
}

const Settings: React.FC<Props> = ({ user, onUpdateUser, onNavigate, onSelectPlan, onLogout, onShowSuccess }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande! Por favor, escolha uma imagem com menos de 5MB.");
        return;
      }

      setIsSaving(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 200;

          if (width > height) {
            if (width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, photo: compressedBase64 });
          setIsSaving(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdateUser(formData);
    setIsSaving(false);
    if (success) {
      onShowSuccess("Perfil atualizado com sucesso!");
    }
  };

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-screen animate-in fade-in duration-500">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-center">
        <h1 className="text-xl font-black text-brand-navy dark:text-white uppercase tracking-widest">Ajustes de Perfil</h1>
      </header>

      <main className="p-6 space-y-8">
        {/* Foto de Perfil */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="size-32 rounded-full border-4 border-white dark:border-brand-navy shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img 
                src={formData.photo || `https://ui-avatars.com/api/?name=${formData.name}&background=002D56&color=fff`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute bottom-1 right-1 size-10 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">camera_alt</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <div className="text-center">
            <h2 className="font-black text-xl text-brand-navy dark:text-white">{formData.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formData.email}</p>
          </div>
        </section>

        {/* Informações Básicas */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Minha Identidade</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brand-navy dark:text-slate-400 ml-1 uppercase">Nome de Usuário</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-orange dark:text-white outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brand-navy dark:text-slate-400 ml-1 uppercase">Biografia Curta</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-orange dark:text-white min-h-[100px] resize-none outline-none"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Especialidade, anos de experiência..."
              />
            </div>
          </div>
        </section>

        {/* Informações da Empresa */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dados Profissionais</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brand-navy dark:text-slate-400 ml-1 uppercase">Nome Comercial</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">business</span>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-orange dark:text-white outline-none"
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                  placeholder="Sua marca"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-brand-navy dark:text-slate-400 ml-1 uppercase">CNPJ / MEI</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">description</span>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-orange dark:text-white outline-none"
                  value={formData.cnpj}
                  onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Assinatura */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assinatura & Planos</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-black text-brand-navy dark:text-white uppercase">Status do Plano</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {user.subscription_status === 'active' 
                    ? `Expira em ${new Date(user.subscription_expiry_date || '').toLocaleDateString('pt-BR')}`
                    : 'Período de Teste (30 dias)'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                user.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {user.subscription_status === 'active' ? 'Ativo' : 'Trial'}
              </span>
            </div>
            
            {user.subscription_status !== 'active' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-brand-navy dark:text-white">Mensal Profissional</p>
                    <p className="text-[10px] font-bold text-slate-400">R$ 9,90 / mês</p>
                  </div>
                  <button 
                    onClick={() => { onSelectPlan('monthly'); onNavigate('CHECKOUT'); }}
                    className="bg-brand-orange text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                  >
                    Assinar
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-brand-navy dark:text-white">Anual Premium</p>
                    <p className="text-[10px] font-bold text-slate-400">R$ 99,90 / ano</p>
                  </div>
                  <button 
                    onClick={() => { onSelectPlan('yearly'); onNavigate('CHECKOUT'); }}
                    className="bg-brand-orange text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                  >
                    Assinar
                  </button>
                </div>
              </div>
            )}
            
            {user.subscription_status === 'active' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">verified</span>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Sua assinatura {user.plan_type === 'monthly' ? 'Mensal' : 'Anual'} está ativa e protegida.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Ações */}
        <section className="space-y-3 pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-brand-orange text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {isSaving ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                <span>Salvar Tudo</span>
              </>
            )}
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sair da Conta</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
