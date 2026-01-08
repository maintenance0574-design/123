
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';

interface CategoryManagementProps {
  categories: string[];
  inventory: InventoryItem[];
  onUpdateCategory: (oldName: string, newName: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  inventory, 
  onUpdateCategory, 
  onAddCategory, 
  onDeleteCategory 
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingCats, setEditingCats] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [categories, inventory]);

  const getItemCount = (cat: string) => {
    return inventory.filter(i => i.category === cat).length;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onAddCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">品類管理中心</h2>
          <p className="text-slate-500 mt-1">管理商品的分類架構，保持倉庫秩序</p>
        </div>
      </div>

      {/* Add New Category Card */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i data-lucide="plus-circle" className="w-10 h-10"></i>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold">新增全新品類</h3>
            <p className="text-indigo-100 text-sm">請輸入新的分類名稱，這將會立即套用到所有倉庫選擇器中</p>
          </div>
          <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="例如：冷鏈物流、易碎品..."
              className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/10 focus:bg-white/20 transition-all font-bold placeholder:text-indigo-200 flex-1 md:w-64"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-95 whitespace-nowrap"
            >
              確認新增
            </button>
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = getItemCount(cat);
          const isEditing = editingCats[cat] !== undefined;

          return (
            <div key={cat} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-lg transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                  <i data-lucide="tag" className="w-6 h-6 text-slate-400 group-hover:text-indigo-500"></i>
                </div>
                <button 
                  onClick={() => onDeleteCategory(cat)}
                  disabled={count > 0}
                  className={`p-2 rounded-xl transition-all ${count > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                >
                  <i data-lucide="trash-2" className="w-5 h-5"></i>
                </button>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-slate-50 border-b-2 border-indigo-500 px-2 py-1 font-black text-xl text-slate-800 focus:outline-none"
                      value={editingCats[cat]}
                      onChange={(e) => setEditingCats({...editingCats, [cat]: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateCategory(cat, editingCats[cat]);
                          const next = { ...editingCats };
                          delete next[cat];
                          setEditingCats(next);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        onUpdateCategory(cat, editingCats[cat]);
                        const next = { ...editingCats };
                        delete next[cat];
                        setEditingCats(next);
                      }}
                      className="p-2 text-emerald-500 bg-emerald-50 rounded-lg"
                    >
                      <i data-lucide="check" className="w-5 h-5"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/title">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{cat}</h4>
                    <button 
                      onClick={() => setEditingCats({...editingCats, [cat]: cat})}
                      className="opacity-0 group-hover/title:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <i data-lucide="edit-2" className="w-4 h-4"></i>
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{count} 件商品</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2">
                <i data-lucide="info" className="w-3.5 h-3.5 text-slate-300"></i>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {count > 0 ? '目前庫存中使用中' : '尚未分配任何商品'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryManagement;
