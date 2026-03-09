import React from 'react';
import { ViewState, User } from '../types';

interface Props {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User | null;
}

const Navigation: React.FC<Props> = ({ currentView, onNavigate, user }) => {
  const navItems = [
    { name: 'Início', view: 'DASHBOARD' as ViewState, icon: 'home' },
    { name: 'Clientes', view: 'COMPANIES' as ViewState, icon: 'groups' },
    { name: 'Eventos', view: 'EVENTS' as ViewState, icon: 'event' },
    { name: 'Perfil', view: 'SETTINGS' as ViewState, icon: 'person' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', view: 'ADMIN_DASHBOARD' as ViewState, icon: 'admin_panel_settings' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 flex justify-around p-2 z-50">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => onNavigate(item.view)}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            currentView === item.view
              ? 'text-brand-orange'
              : 'text-slate-400 hover:text-brand-navy dark:hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
          <span className="text-[10px] font-bold uppercase mt-1">{item.name}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
