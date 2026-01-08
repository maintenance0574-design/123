
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';

interface WarehouseManagementProps {
  warehouses: string[];
  inventory: InventoryItem[];
  onAddWarehouse: (name: string) => void;
  onDeleteWarehouse: (name: string, targetWh?: string) => void;
  onUpdateWarehouseName: (oldName: string, newName: string) => void;
}

const WarehouseManagement: React.FC<WarehouseManagementProps> = ({ 
  warehouses, 
  inventory, 
  onAddWarehouse, 
  onDeleteWarehouse,
  onUpdateWarehouseName
}) => {
  const [newName, setNewName] = useState('');
  const [editingState, setEditingState] = useState<{old: string, new: string} | null>(null);
  const [deletingWh, setDeletingWh] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [warehouses, inventory, editingState, deletingWh]);

  const getItemCount = (wh: string) => {
    return inventory.filter(i => i.warehouse === wh).length;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed && !warehouses.includes(trimmed)) {
      onAddWarehouse(trimmed);
      setNewName('');
    } else if (warehouses.includes(trimmed)) {
      alert("此倉區名稱已存在。");
    }
  };

  const confirmDelete = () => {
    if (!deletingWh) return;
    const count = getItemCount(deletingWh);
    const otherWh = warehouses.find(w => w !== deletingWh) || '';
    
    if (count > 0) {
      onDeleteWarehouse(deletingWh, otherWh);
    } else {
      onDeleteWarehouse(deletingWh);
    }
    setDeletingWh(null);
  };

  const handleUpdate = () => {
    if (editingState && editingState.new.trim()) {
      const trimmedNew = editingState.new.trim();
      if (trimmedNew === editingState.old) {
        setEditingState(null);
        return;
      }
      if (warehouses.includes(trimmedNew)) {
        alert("目標倉區名稱已存在。");
        return;
      }
      onUpdateWarehouseName(editingState.old, trimmedNew);
      setEditingState(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-black pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">倉儲空間調度</h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            管理物理儲位與資產流向
          </p>
        </div>
      </div>

      {/* 新增倉區區塊 */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <i data-lucide="map-pin" className="w-32 h-32"></i>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
            <i data-lucide="plus" className="w-10 h-10"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black">啟用新儲位</h3>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">例如：成品倉 A、報廢區、維修站</p>
          </div>
          <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="倉區名稱..."
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/40 transition-all font-black text-sm flex-1 md:w-64"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all shadow-xl active:scale-95 whitespace-nowrap"
            >
              新增
            </button>
          </form>
        </div>
      </div>

      {/* 倉區清單 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => {
          const count = getItemCount(wh);
          const hasItems = count > 0;
          const isEditing = editingState?.old === wh;

          return (
            <div key={wh} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                  <i data-lucide={isEditing ? 'edit-3' : 'home'} className="w-6 h-6"></i>
                </div>
                
                <div className="flex gap-1">
                  {!isEditing ? (
                    <>
                      <button 
                        onClick={() => setEditingState({ old: wh, new: wh })}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <i data-lucide="edit-3" className="w-4.5 h-4.5"></i>
                      </button>
                      <button 
                        onClick={() => setDeletingWh(wh)}
                        className={`p-2.5 rounded-xl transition-all ${warehouses.length <= 1 ? 'text-slate-100 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                        disabled={warehouses.length <= 1}
                      >
                        <i data-lucide="trash-2" className="w-4.5 h-4.5"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleUpdate} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl"><i data-lucide="check" className="w-4.5 h-4.5"></i></button>
                      <button onClick={() => setEditingState(null)} className="p-2.5 text-slate-400 bg-slate-50 rounded-xl"><i data-lucide="x" className="w-4.5 h-4.5"></i></button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <input
                    autoFocus
                    className="text-xl font-black text-black tracking-tight border-b-2 border-indigo-500 bg-transparent focus:outline-none w-full pb-1"
                    value={editingState.new}
                    onChange={(e) => setEditingState({ ...editingState, new: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                  />
                ) : (
                  <h4 className="text-xl font-black text-black tracking-tight uppercase italic">{wh}</h4>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">當前庫存品項</p>
                    <p className="text-xl font-black font-mono mt-1">{count}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${hasItems ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    {hasItems ? '使用中' : '空置中'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 刪除確認模組 */}
      {deletingWh && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <i data-lucide="alert-triangle" className="w-10 h-10"></i>
            </div>
            
            <h3 className="text-2xl font-black text-center mb-4">確定刪除「{deletingWh}」？</h3>
            
            {getItemCount(deletingWh) > 0 ? (
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
                <p className="text-sm font-black text-indigo-900 mb-2">檢測到受影響物資：</p>
                <p className="text-xs text-indigo-700/80 font-bold leading-relaxed mb-4">
                  此倉區目前存放有 <span className="text-indigo-600 font-black">{getItemCount(deletingWh)}</span> 項商品。
                </p>
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-indigo-200">
                  <i data-lucide="move-right" className="w-4 h-4 text-indigo-400"></i>
                  <p className="text-[10px] font-black text-indigo-600 uppercase">
                    這些商品將自動遷移至：<span className="underline">{warehouses.find(w => w !== deletingWh)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center text-sm font-bold mb-8">這是一個空倉區，可以安全移除。</p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingWh(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl text-xs hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;
