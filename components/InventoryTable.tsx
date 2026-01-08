
import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { InventoryItem, Staff } from '../types';

interface InventoryTableProps {
  items: InventoryItem[];
  categories: string[];
  warehouses: string[];
  staff: Staff[];
  onUpdateQuantity: (id: string, newQty: number, operator: string) => void;
  onEditItem: (item: InventoryItem | null) => void;
  onDeleteItem: (item: InventoryItem) => void;
  isModalOpen: boolean;
  editingItem: InventoryItem | null;
  onCloseModal: () => void;
  onSaveItem: (item: InventoryItem, operator: string, label?: string, transferData?: { targetWarehouse: string, quantity: number }) => void;
  onBatchSave?: (items: InventoryItem[], operator: string) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onBatchUpdate?: (ids: string[], updates: Partial<InventoryItem>, operator: string) => void;
  onBatchDelete?: (ids: string[]) => void;
}

type OperationType = 'DIRECT' | 'FIX' | 'WITHDRAW' | 'MAINTENANCE' | 'RETURN' | 'ADJUST' | 'TRANSFER';

interface BatchAddRow {
  tempId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  warehouse: string;
  minThreshold: number;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  categories,
  warehouses,
  staff,
  onEditItem, 
  onDeleteItem,
  isModalOpen,
  editingItem,
  onCloseModal,
  onSaveItem,
  onBatchSave,
  onBatchUpdate,
  onBatchDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [currentOperator, setCurrentOperator] = useState<string>(staff[0]?.name || '');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // 批次操作與批次新增狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);
  const [batchAddRows, setBatchAddRows] = useState<BatchAddRow[]>([]);
  
  const [operationType, setOperationType] = useState<OperationType>('DIRECT');
  const [operationValue, setOperationValue] = useState<number>(0);
  const [machineNumber, setMachineNumber] = useState<string>('');
  const [targetWarehouse, setTargetWarehouse] = useState<string>('');
  
  const [formData, setFormData] = useState<InventoryItem>({
    id: '', name: '', sku: '', category: categories[0] || '其他',
    quantity: 0, minThreshold: 10, price: 0, warehouse: warehouses[0] || '未定', lastUpdated: ''
  });

  // 根據篩選條件過濾品項
  const filteredItems = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term) || 
                            item.sku.toLowerCase().includes(term);
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesWh = selectedWarehouse === 'ALL' || item.warehouse === selectedWarehouse;
      const matchesLowStock = showLowStockOnly ? item.quantity < item.minThreshold : true;
      return matchesSearch && matchesCat && matchesWh && matchesLowStock;
    });
  }, [items, deferredSearchTerm, selectedCategory, selectedWarehouse, showLowStockOnly]);

  // 過濾條件變更時重設分頁
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedCategory, selectedWarehouse, showLowStockOnly]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
      setOperationType('DIRECT');
      const otherWh = warehouses.find(w => w !== editingItem.warehouse) || warehouses[0];
      setTargetWarehouse(otherWh);
      setMachineNumber('');
    } else {
      setFormData({
        id: `item-${Date.now()}`, name: '', sku: '', category: categories[0] || '其他',
        quantity: 0, minThreshold: 10, price: 0, warehouse: warehouses[0] || '未定', lastUpdated: ''
      });
      setOperationType('DIRECT');
      setMachineNumber('');
    }
    setOperationValue(0);
  }, [editingItem, isModalOpen, categories, warehouses]);

  useEffect(() => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [isModalOpen, paginatedItems, categories, warehouses, selectedCategory, selectedWarehouse, showLowStockOnly, isBatchAddModalOpen, batchAddRows, currentPage, operationType]);

  const lowStockCount = useMemo(() => items.filter(i => i.quantity < i.minThreshold).length, [items]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map(i => i.id));
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalQty = formData.quantity;
    let label = editingItem ? '庫存調整' : '初始入庫';
    let transferData: { targetWarehouse: string, quantity: number } | undefined = undefined;

    const machineTag = machineNumber.trim() ? ` [機台: ${machineNumber.trim()}]` : '';

    if (editingItem && operationType !== 'DIRECT') {
      if (operationType === 'WITHDRAW') { 
        finalQty = Math.max(0, editingItem.quantity - operationValue); 
        label = `領料出庫${machineTag}`; 
      }
      else if (operationType === 'MAINTENANCE') { 
        finalQty = Math.max(0, editingItem.quantity - operationValue); 
        label = `維修撥出${machineTag}`; 
      }
      else if (operationType === 'RETURN') { finalQty = editingItem.quantity + operationValue; label = '返修入庫'; }
      else if (operationType === 'ADJUST') { finalQty = editingItem.quantity + operationValue; label = '數量調整'; }
      else if (operationType === 'TRANSFER') {
        finalQty = Math.max(0, editingItem.quantity - operationValue);
        label = `移倉撥出 (${editingItem.warehouse} -> ${targetWarehouse})`;
        transferData = { targetWarehouse, quantity: operationValue };
      }
      else if (operationType === 'FIX') { finalQty = operationValue; label = '盤點修正'; }
    }
    onSaveItem({ ...formData, quantity: finalQty }, currentOperator, label, transferData);
  };

  const openBatchAdd = () => {
    setBatchAddRows([{
      tempId: `temp-${Date.now()}`, name: '', sku: '', category: categories[0] || '其他',
      quantity: 0, price: 0, warehouse: warehouses[0] || '未定', minThreshold: 10
    }]);
    setIsBatchAddModalOpen(true);
  };

  const submitBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newItems: InventoryItem[] = batchAddRows.map(row => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: row.name, sku: row.sku, category: row.category, quantity: row.quantity,
      price: row.price, warehouse: row.warehouse, minThreshold: row.minThreshold,
      lastUpdated: new Date().toISOString().split('T')[0]
    }));
    if (onBatchSave) onBatchSave(newItems, currentOperator);
    setIsBatchAddModalOpen(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 animate-fadeIn text-black relative">
      {lowStockCount > 0 && !showLowStockOnly && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center animate-pulse">
              <i data-lucide="alert-circle" className="w-6 h-6"></i>
            </div>
            <div>
              <p className="text-sm font-black text-rose-900">檢測到庫存水位異常</p>
              <p className="text-[11px] font-bold text-rose-700 opacity-80 uppercase tracking-widest">目前共有 {lowStockCount} 項商品低於安全庫存。</p>
            </div>
          </div>
          <button onClick={() => setShowLowStockOnly(true)} className="px-5 py-2 bg-rose-600 text-white text-[11px] font-black rounded-xl hover:bg-rose-700 transition-all shadow-lg">立即篩選需補貨品項</button>
        </div>
      )}

      {/* 篩選與快捷鍵區域 */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <i data-lucide="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
            <input
              type="text"
              placeholder="快速搜尋品名/SKU..."
              className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none font-black text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowLowStockOnly(!showLowStockOnly)} className={`px-5 py-3 rounded-2xl text-[12px] font-black flex items-center gap-2 transition-all border ${showLowStockOnly ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-slate-50 text-black border-slate-100'}`}>
              <i data-lucide="radar" className={`w-4 h-4 ${showLowStockOnly ? 'animate-spin' : ''}`}></i>
              {showLowStockOnly ? '低庫存模式' : '監測低庫存'}
            </button>
            <button onClick={openBatchAdd} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
              <i data-lucide="layers" className="w-4 h-4"></i> 批次錄入
            </button>
            <button onClick={() => onEditItem(null)} className="bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
              <i data-lucide="plus" className="w-4 h-4"></i> 新增單項
            </button>
          </div>
        </div>

        {/* 快捷鍵過濾器 */}
        <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-50">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
              <i data-lucide="map-pin" className="w-3 h-3"></i> 倉區快捷
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWarehouse('ALL')}
                className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
                  selectedWarehouse === 'ALL' 
                  ? 'bg-black text-white border-black shadow-md' 
                  : 'bg-white text-black border-slate-200 hover:border-black'
                }`}
              >
                全部位置
              </button>
              {warehouses.map(wh => (
                <button
                  key={wh}
                  onClick={() => setSelectedWarehouse(wh)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
                    selectedWarehouse === wh 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-black border-slate-200 hover:border-black'
                  }`}
                >
                  {wh}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
              <i data-lucide="tags" className="w-3 h-3"></i> 品類篩選
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
                  selectedCategory === 'ALL' 
                  ? 'bg-black text-white border-black shadow-md' 
                  : 'bg-white text-black border-slate-200 hover:border-black'
                }`}
              >
                所有品類
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
                    selectedCategory === cat 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-white text-black border-slate-200 hover:border-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 庫存列表表格 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-12"><input type="checkbox" className="w-4 h-4 accent-black cursor-pointer" checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} onChange={toggleSelectAll}/></th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em]">品項規格</th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em] text-center">實時庫存</th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em] text-right">單價</th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em] text-right">資產淨值</th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em]">存放位置與品類</th>
                <th className="px-6 py-5 text-[11px] font-black text-black uppercase tracking-[0.2em] text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <i data-lucide="package-search" className="w-16 h-16"></i>
                      <p className="text-sm font-black uppercase tracking-widest">查無對應庫存品項</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  const isLowStock = item.quantity < item.minThreshold;
                  return (
                    <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-5"><input type="checkbox" className="w-4 h-4 accent-black cursor-pointer" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)}/></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isLowStock ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-black group-hover:bg-black group-hover:text-white group-hover:border-black'}`}>
                            <i data-lucide={isLowStock ? 'alert-triangle' : 'package'} className="w-6 h-6"></i>
                          </div>
                          <div>
                            <p className="font-black text-black text-sm uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 tracking-tighter uppercase">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black font-mono border ${isLowStock ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-slate-100 text-black border-transparent'}`}>
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black font-mono text-xs text-black">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-xs font-black text-black font-mono tracking-tight">{formatCurrency(item.price * item.quantity)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            <i data-lucide="map-pin" className="w-2.5 h-2.5"></i> {item.warehouse}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <i data-lucide="tag" className="w-2.5 h-2.5"></i> {item.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onEditItem(item)} className="p-2.5 text-black hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"><i data-lucide="settings-2" className="w-4 h-4"></i></button>
                          <button onClick={() => onDeleteItem(item)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">顯示第 {(currentPage-1)*itemsPerPage+1} 至 {Math.min(currentPage*itemsPerPage, filteredItems.length)} 筆 / 共 {filteredItems.length} 筆資產</p>
            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all text-black"
              >
                <i data-lucide="chevron-left" className="w-4 h-4"></i>
              </button>
              <div className="flex gap-1.5 px-2">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all border ${currentPage === p ? 'bg-black text-white border-black shadow-lg scale-110' : 'bg-transparent text-slate-400 border-transparent hover:bg-white hover:text-black hover:border-slate-200'}`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="text-slate-300 px-1 pt-2">...</span>;
                  return null;
                })}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all text-black"
              >
                <i data-lucide="chevron-right" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 批次操作浮動選單 */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 z-[150] animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-4 border-r border-white/10 pr-10">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20">{selectedIds.length}</div>
            <div>
              <p className="text-sm font-black tracking-tight uppercase">已選取品項</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Batch Selection</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsBatchModalOpen(true)} className="px-7 py-3 bg-white text-black rounded-2xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95">批次修改</button>
            <button onClick={() => { if (window.confirm(`確定要刪除這 ${selectedIds.length} 個品項嗎？`)) { onBatchDelete?.(selectedIds); setSelectedIds([]); } }} className="px-7 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-900/20">批次刪除</button>
            <button onClick={() => setSelectedIds([])} className="px-6 py-3 text-white/40 hover:text-white text-xs font-black transition-all uppercase tracking-widest">取消</button>
          </div>
        </div>
      )}

      {/* 批次錄入彈窗 */}
      {isBatchAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div><h3 className="text-2xl font-black text-black">批次錄入專區</h3><p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Efficient Data Entry</p></div>
              <button onClick={() => setIsBatchAddModalOpen(false)} className="p-2.5 rounded-full hover:bg-slate-200 text-black transition-colors"><i data-lucide="x" className="w-6 h-6"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <form onSubmit={submitBatchAdd} className="space-y-4">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-4 pr-4">品名</th><th className="pb-4 pr-4 w-32">SKU</th><th className="pb-4 pr-4 w-36">品類</th><th className="pb-4 pr-4 w-24">數量</th><th className="pb-4 pr-4 w-28">單價</th><th className="pb-4 pr-4 w-32">倉區</th><th className="pb-4 w-10"></th></tr></thead>
                  <tbody>
                    {batchAddRows.map((row) => (
                      <tr key={row.tempId} className="group hover:bg-slate-50/50">
                        <td className="py-2 pr-4"><input required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-black" value={row.name} onChange={(e) => updateBatchRow(row.tempId, 'name', e.target.value)} /></td>
                        <td className="py-2 pr-4"><input required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase text-black font-black" value={row.sku} onChange={(e) => updateBatchRow(row.tempId, 'sku', e.target.value)} /></td>
                        <td className="py-2 pr-4">
                          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-black" value={row.category} onChange={(e) => updateBatchRow(row.tempId, 'category', e.target.value)}>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4"><input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-black font-black" value={row.quantity} onChange={(e) => updateBatchRow(row.tempId, 'quantity', Number(e.target.value))} /></td>
                        <td className="py-2 pr-4"><input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-black font-black" value={row.price} onChange={(e) => updateBatchRow(row.tempId, 'price', Number(e.target.value))} /></td>
                        <td className="py-2 pr-4">
                          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-black" value={row.warehouse} onChange={(e) => updateBatchRow(row.tempId, 'warehouse', e.target.value)}>
                            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => removeBatchRow(row.tempId)} className={`p-2 text-slate-300 hover:text-rose-600 transition-colors ${batchAddRows.length <= 1 ? 'opacity-0' : ''}`}><i data-lucide="minus-circle" className="w-4 h-4"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center py-6">
                  <button type="button" onClick={() => { const last = batchAddRows[batchAddRows.length-1]; setBatchAddRows([...batchAddRows, { ...last, tempId: `temp-${Date.now()}-${batchAddRows.length}`, quantity: 0 }]); }} className="px-8 py-3.5 bg-slate-100 text-black rounded-2xl text-xs font-black border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-all">+ 新增一行</button>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsBatchAddModalOpen(false)} className="px-10 py-3.5 bg-slate-100 font-black rounded-2xl text-xs text-black hover:bg-slate-200 transition-all">取消</button>
                    <button type="submit" className="px-14 py-3.5 bg-black text-white font-black rounded-2xl text-xs shadow-2xl hover:bg-slate-900 transition-all">確認批量存檔</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 單項錄入/編輯彈窗 - 保持精簡版面 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-black tracking-tight">{editingItem ? '庫存精度調整' : '資產初始錄入'}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inventory Management</p>
                </div>
                <button onClick={onCloseModal} className="p-2 rounded-full hover:bg-slate-100 text-black transition-colors"><i data-lucide="x" className="w-5 h-5"></i></button>
              </div>
              <form onSubmit={handleItemSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">品名</label><input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">SKU 編碼</label><input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono text-black font-black focus:outline-none focus:border-black transition-all" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">所屬品類</label>
                    <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">單品定價</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
                  </div>
                  
                  {editingItem ? (
                    <div className="col-span-full bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-3.5">
                      <div className="flex justify-between border-b border-slate-200 pb-2.5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">異動運籌控制項</h4>
                        <span className="text-[13px] font-black font-mono text-black">結存預覽: {getPreviewQty()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <select className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-black focus:outline-none focus:border-black transition-all" value={operationType} onChange={(e) => { const val = e.target.value as OperationType; setOperationType(val); setOperationValue(val === 'FIX' ? editingItem.quantity : 0); }}>
                          <option value="DIRECT">僅修改基本資料</option><option value="TRANSFER">移倉撥出 (-)</option><option value="WITHDRAW">領料撥出 (-)</option><option value="MAINTENANCE">維修撥出 (-)</option><option value="RETURN">返修入庫 (+)</option><option value="FIX">盤點修正 (RESET)</option>
                        </select>
                        {operationType !== 'DIRECT' && <input type="number" className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono text-black font-black focus:outline-none focus:border-black transition-all" placeholder="數量..." value={operationValue} onChange={(e) => setOperationValue(Number(e.target.value))} />}
                        
                        {(operationType === 'WITHDRAW' || operationType === 'MAINTENANCE') && (
                          <div className="col-span-full space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                              <i data-lucide="monitor" className="w-3 h-3 text-indigo-500"></i> 機台號碼 / 用途標記
                            </label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-2xl text-xs font-black text-black focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                              placeholder="輸入機台代號 (如: #A01-3)..." 
                              value={machineNumber} 
                              onChange={(e) => setMachineNumber(e.target.value)} 
                            />
                          </div>
                        )}

                        {operationType === 'TRANSFER' && (
                          <select className="col-span-full px-4 py-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-[10px] font-black shadow-sm" value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)}>
                            {warehouses.map(opt => <option key={opt} value={opt} disabled={opt === editingItem.warehouse}>{opt} (接收方)</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">初始庫存量</label>
                        <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">存放倉區</label>
                        <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.warehouse} onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}>
                          {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="col-span-full space-y-1.5"><label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">安全水位警告閾值</label><input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-black focus:outline-none focus:border-black transition-all" value={formData.minThreshold} onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })} /></div>
                </div>
                <div className="flex gap-3.5 pt-3">
                  <button type="button" onClick={onCloseModal} className="flex-1 py-3.5 bg-slate-100 text-black font-black rounded-2xl text-[11px] hover:bg-slate-200 transition-all">取消</button>
                  <button type="submit" className="flex-[2] py-3.5 bg-black text-white font-black rounded-2xl text-[11px] shadow-xl hover:bg-slate-900 transition-all active:scale-95">確認儲存品項</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getPreviewQty() {
    if (!editingItem) return formData.quantity;
    if (operationType === 'DIRECT') return editingItem.quantity;
    if (operationType === 'FIX') return operationValue;
    if (operationType === 'WITHDRAW' || operationType === 'TRANSFER' || operationType === 'MAINTENANCE') return Math.max(0, editingItem.quantity - operationValue);
    return editingItem.quantity + operationValue;
  }

  function updateBatchRow(tempId: string, field: keyof BatchAddRow, value: any) {
    setBatchAddRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
  }

  function removeBatchRow(tempId: string) {
    if (batchAddRows.length > 1) setBatchAddRows(prev => prev.filter(row => row.tempId !== tempId));
  }
};

export default InventoryTable;
