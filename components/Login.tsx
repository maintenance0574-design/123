
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';

interface LoginProps {
  staff: Staff[];
  onLogin: (member: Staff) => void;
  onInitialize: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ staff, onLogin, onInitialize }) => {
  const [initName, setInitName] = useState('');

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [staff]);

  const handleInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initName.trim()) {
      onInitialize(initName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <i data-lucide="box" className="w-8 h-8 text-black"></i>
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Zenith Pro</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] mt-2">Enterprise Warehouse OS</p>
          </div>

          {staff.length === 0 ? (
            <div className="animate-fadeIn">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
                <p className="text-xs font-bold text-white/80 leading-relaxed text-center">
                  偵測到系統尚未初始化。<br/>請設定第一位<span className="text-emerald-400 font-black">超級管理員</span>。
                </p>
              </div>
              <form onSubmit={handleInit} className="space-y-4">
                <div className="relative">
                  <i data-lucide="user" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"></i>
                  <input
                    required
                    type="text"
                    placeholder="管理員姓名"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all"
                    value={initName}
                    onChange={(e) => setInitName(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl">
                  完成初始化
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] text-center mb-4">請選擇帳號進入系統</p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {staff.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => onLogin(member)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10">
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-black text-white">{member.name}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{member.role}</p>
                    </div>
                    <i data-lucide="chevron-right" className="w-4 h-4 text-white/10 group-hover:text-white/60 transition-colors"></i>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-[10px] font-bold text-white/20 uppercase tracking-widest">
          &copy; 2024 Zenith Warehouse Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
