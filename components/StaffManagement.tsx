
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';

interface StaffManagementProps {
  staff: Staff[];
  onAddStaff: (member: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ staff, onAddStaff, onDeleteStaff }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '理貨專員'
  });

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [staff, isModalOpen, isDeleteConfirmOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newMember: Staff = {
      id: `staff-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      status: 'Active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
      lastLogin: new Date().toLocaleDateString()
    };

    onAddStaff(newMember);
    setFormData({ name: '', role: '理貨專員' });
    setIsModalOpen(false);
  };

  const openDeleteConfirm = (member: Staff) => {
    if (member.id === 's1') {
      alert('無法刪除系統預設管理員。');
      return;
    }
    setStaffToDelete(member);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      onDeleteStaff(staffToDelete.id);
      setIsDeleteConfirmOpen(false);
      setStaffToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">管理人員設置</h2>
          <p className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">目前共有 {staff.length} 位具備操作權限的人員</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
        >
          <i data-lucide="user-plus" className="w-5 h-5"></i>
          授權新管理員
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-black transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-20 h-20 rounded-3xl overflow-hidden ring-4 ring-slate-50 group-hover:ring-black/5 transition-all bg-slate-100">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.status === 'Active' ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-400 border-slate-100'} border`}>
                  {member.status === 'Active' ? '管理權限' : '已停權'}
                </span>
                <button 
                  onClick={() => openDeleteConfirm(member)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <i data-lucide="trash-2" className="w-5 h-5"></i>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight">{member.name}</h3>
              <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest mt-0.5">{member.role}</p>
              
              <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最後異動日</p>
                  <p className="text-xs font-bold mt-0.5">{member.lastLogin || '無紀錄'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <i data-lucide="shield-check" className="w-4 h-4"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新增人員彈窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">授權新管理員</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-black transition-colors">
                  <i data-lucide="x" className="w-6 h-6"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">人員真實姓名</label>
                  <input
                    autoFocus required type="text"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-black transition-all font-black text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">指派職務</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-black appearance-none font-black text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="資深倉管">資深倉管 (Full Access)</option>
                    <option value="理貨專員">理貨專員 (Operation Only)</option>
                    <option value="倉庫主管">倉庫主管 (Review Only)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-black text-white font-black rounded-2xl hover:bg-slate-900 transition-all shadow-xl mt-4 active:scale-95"
                >
                  確認授權
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 刪除人員確認彈窗 */}
      {isDeleteConfirmOpen && staffToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i data-lucide="user-minus" className="w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-black mb-2">確定撤銷管理權限？</h3>
            <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">
              您即將撤銷 <span className="underline">{staffToDelete.name}</span> 的操作權限。<br/>此動作將立即生效且無法復原。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-3 bg-slate-100 font-black rounded-xl text-xs hover:bg-slate-200">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl text-xs hover:bg-rose-700 shadow-lg shadow-rose-200">撤銷權限</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
