
import React from 'react';
import { Staff } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'transactions' | 'ai' | 'staff' | 'categories' | 'warehouses';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'transactions' | 'ai' | 'staff' | 'categories' | 'warehouses') => void;
  currentUser: Staff | null;
  onLogout: () => void;
  lowStockCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, lowStockCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: '儀表板' },
    { id: 'inventory', icon: 'Package', label: '庫存管理', badge: lowStockCount },
    { id: 'categories', icon: 'Tags', label: '品類管理' },
    { id: 'warehouses', icon: 'MapPin', label: '倉區管理' },
    { id: 'transactions', icon: 'ArrowLeftRight', label: '異動紀錄' },
    { id: 'staff', icon: 'Users', label: '人員管理' },
    { id: 'ai', icon: 'Sparkles', label: 'AI 智慧助理' },
  ];

  if (!currentUser) return null;

  return (
    <div className="w-56 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col p-4 z-50 shadow-2xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
          <i data-lucide="box" className="w-6 h-6"></i>
        </div>
        <h1 className="text-xl font-black tracking-tighter italic uppercase">Zenith Pro</h1>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pb-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-base relative ${
              activeTab === item.id 
              ? 'bg-white text-black font-black shadow-xl' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
            }`}
          >
            <i data-lucide={item.icon} className="w-5 h-5"></i>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center border border-white/10 overflow-hidden shadow-inner">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate text-white">{currentUser.name}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
