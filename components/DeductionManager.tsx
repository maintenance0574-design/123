
import React, { useState, useEffect } from 'react';
import { InventoryItem, BOMTemplate, Staff } from '../types';

interface DeductionManagerProps {
  inventory: InventoryItem[];
  currentUser: Staff;
  onAutoDeduct: (template: BOMTemplate, multiplier: number, operator: string) => void;
}

const DeductionManager: React.FC<DeductionManagerProps> = ({ inventory, currentUser, onAutoDeduct }) => {
  const [templates, setTemplates] = useState<BOMTemplate[]>([
    {
      id: 'bom-1',
      name: '標準保養組件',
      description: '包含常用的線材與固定扣件',
      items: [
        { sku: 'ACC-USBC-02', quantityPerKit: 2 },
        { sku: 'MBP-14-2023', quantityPerKit: 1 }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BOMTemplate | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [templates, isModalOpen]);

  const handleExecute = () => {
    if (!selectedTemplate) return;
    onAutoDeduct(selectedTemplate, multiplier, currentUser.name);
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setMultiplier(1);
  };

  const checkAvailability = (template: BOMTemplate, mult: number) => {
    return template.items.map(item => {
      const stock = inventory.find(i => i.sku === item.sku);
      const needed = item.quantityPerKit * mult;
      return {
        sku: item.sku,
        name: stock?.name || '未知品項',
        needed,
        current: stock?.quantity || 0,
        isEnough: (stock?.quantity || 0) >= needed
      };
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-black">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic">Auto Deduction</h2>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">領料模板與自動扣料系統</p>
        </div>
        <button 
          onClick={() => alert('此範例僅供展示扣料邏輯，模板新增功能可於正式版擴充。')}
          className="bg-slate-100 text-black px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          + 定義新模板 (BOM)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center">
                <i data-lucide="component" className="w-7 h-7"></i>
              </div>
              <button 
                onClick={() => { setSelectedTemplate(tpl); setIsModalOpen(true); }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
              >
                執行扣料
              </button>
            </div>
            <h3 className="text-xl font-black">{tpl.name}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 mb-6">{tpl.description}</p>
            
            <div className="space-y-3">
              {tpl.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 font-mono">{item.sku}</span>
                  </div>
                  <span className="text-xs font-black">單位用量: x{item.quantityPerKit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10">
              <h3 className="text-2xl font-black mb-2">確認自動扣料：{selectedTemplate.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">系統將自動從各倉庫扣除對應品項</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">領取套數</label>
                  <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => setMultiplier(Math.max(1, multiplier - 1))} className="w-12 h-12 bg-slate-100 rounded-xl font-black">-</button>
                    <input 
                      type="number" 
                      className="flex-1 text-center py-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button onClick={() => setMultiplier(multiplier + 1)} className="w-12 h-12 bg-slate-100 rounded-xl font-black">+</button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 pb-2">扣料試算與庫存檢查</p>
                  {checkAvailability(selectedTemplate, multiplier).map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black">{res.name}</p>
                        <p className="text-[9px] font-bold text-slate-400">現有: {res.current} / 需扣除: {res.needed}</p>
                      </div>
                      <i data-lucide={res.isEnough ? "check-circle" : "alert-circle"} className={`w-5 h-5 ${res.isEnough ? "text-emerald-500" : "text-rose-500"}`}></i>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 font-black rounded-2xl text-xs uppercase tracking-widest">取消</button>
                  <button 
                    onClick={handleExecute}
                    disabled={checkAvailability(selectedTemplate, multiplier).some(r => !r.isEnough)}
                    className="flex-[2] py-4 bg-black text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl disabled:opacity-20"
                  >
                    確認執行自動扣料
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeductionManager;
