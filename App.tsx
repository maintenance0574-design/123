
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import AIChat from './components/AIChat';
import StaffManagement from './components/StaffManagement';
import CategoryManagement from './components/CategoryManagement';
import WarehouseManagement from './components/WarehouseManagement';
import Login from './components/Login';
import { InventoryItem, Transaction, Staff } from './types';
import { INITIAL_INVENTORY, RECENT_TRANSACTIONS, INITIAL_CATEGORIES, INITIAL_STAFF, INITIAL_WAREHOUSES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'transactions' | 'ai' | 'staff' | 'categories' | 'warehouses'>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(RECENT_TRANSACTIONS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [warehouses, setWarehouses] = useState<string[]>(INITIAL_WAREHOUSES);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [txFilter, setTxFilter] = useState<string>('全部');
  const [filterYear, setFilterYear] = useState<string>('全部');
  const [filterMonth, setFilterMonth] = useState<string>('全部');

  useEffect(() => {
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  });

  const lowStockCount = useMemo(() => {
    return inventory.filter(item => item.quantity < item.minThreshold).length;
  }, [inventory]);

  const addTransaction = (itemId: string, itemName: string, type: 'IN' | 'OUT', quantity: number, operator: string, label?: string) => {
    const item = inventory.find(i => i.id === itemId);
    const skuSuffix = item ? ` [${item.sku}]` : '';
    const currentPrice = item ? item.price : 0;
    
    const newTx: Transaction = {
      id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      itemId,
      itemName: `${itemName}${skuSuffix}`,
      type,
      label,
      quantity,
      priceAtTime: currentPrice,
      date: new Date().toLocaleString('zh-TW', { hour12: false }),
      operator: operator || '系統'
    };
    setTransactions(prev => [newTx, ...prev].slice(0, 500));
  };

  const handleUpdateQuantity = (id: string, newQty: number, operatorName: string) => {
    if (newQty < 0) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const type = newQty > item.quantity ? 'IN' : 'OUT';
    const diff = Math.abs(newQty - item.quantity);
    
    setInventory(prev => prev.map(i => 
      i.id === id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString().split('T')[0] } : i
    ));
    
    if (diff > 0) {
      addTransaction(id, item.name, type as 'IN' | 'OUT', diff, operatorName, '庫存快調');
    }
  };

  const handleSaveItem = (item: InventoryItem, operatorName: string, operationLabel?: string, transferData?: { targetWarehouse: string, quantity: number }) => {
    setInventory(prev => {
      let nextInventory = [...prev];
      const itemExists = nextInventory.some(i => i.id === item.id);
      
      if (itemExists) {
        const oldItem = nextInventory.find(i => i.id === item.id)!;
        const diff = Math.abs(item.quantity - oldItem.quantity);
        const transType = item.quantity >= oldItem.quantity ? 'IN' : 'OUT';
        nextInventory = nextInventory.map(i => i.id === item.id ? { ...item, lastUpdated: new Date().toISOString().split('T')[0] } : i);
        if (diff > 0 || operationLabel) {
           addTransaction(item.id, item.name, transType, diff, operatorName, operationLabel || '資料更新');
        }
      } else {
        nextInventory.push({ ...item, lastUpdated: new Date().toISOString().split('T')[0] });
        addTransaction(item.id, item.name, 'IN', item.quantity, operatorName, '初始入庫');
      }

      if (transferData && transferData.quantity > 0) {
        const targetIndex = nextInventory.findIndex(i => i.sku === item.sku && i.warehouse === transferData.targetWarehouse);
        if (targetIndex > -1) {
          const targetItem = nextInventory[targetIndex];
          nextInventory[targetIndex] = { ...targetItem, quantity: targetItem.quantity + transferData.quantity, lastUpdated: new Date().toISOString().split('T')[0] };
          addTransaction(targetItem.id, targetItem.name, 'IN', transferData.quantity, operatorName, `移倉接收 (源自 ${item.warehouse})`);
        } else {
          const newTargetItem: InventoryItem = { ...item, id: `item-${Date.now()}-auto`, warehouse: transferData.targetWarehouse, quantity: transferData.quantity, lastUpdated: new Date().toISOString().split('T')[0] };
          nextInventory.push(newTargetItem);
          addTransaction(newTargetItem.id, newTargetItem.name, 'IN', transferData.quantity, operatorName, `移倉接收 (源自 ${item.warehouse})`);
        }
      }
      return nextInventory;
    });
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleBatchSave = (newItems: InventoryItem[], operatorName: string) => {
    setInventory(prev => {
      const nextInventory = [...prev];
      newItems.forEach(item => {
        const existingIdx = nextInventory.findIndex(i => i.sku === item.sku && i.warehouse === item.warehouse);
        if (existingIdx > -1) {
          nextInventory[existingIdx] = { 
            ...nextInventory[existingIdx], 
            quantity: nextInventory[existingIdx].quantity + item.quantity,
            lastUpdated: new Date().toISOString().split('T')[0] 
          };
          addTransaction(nextInventory[existingIdx].id, nextInventory[existingIdx].name, 'IN', item.quantity, operatorName, '批量追加錄入');
        } else {
          nextInventory.push(item);
          addTransaction(item.id, item.name, 'IN', item.quantity, operatorName, '批量全新品項錄入');
        }
      });
      return nextInventory;
    });
  };

  const handleBatchUpdate = (ids: string[], updates: Partial<InventoryItem>, operatorName: string) => {
    setInventory(prev => {
      const nextInventory = prev.map(item => {
        if (ids.includes(item.id)) {
          const changedFields = Object.keys(updates).join(', ');
          addTransaction(item.id, item.name, 'IN', 0, operatorName, `批次更新: ${changedFields}`);
          return { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return item;
      });
      return nextInventory;
    });
  };

  const handleBatchDelete = (ids: string[]) => {
    setInventory(prev => {
      const itemsToDelete = prev.filter(item => ids.includes(item.id));
      itemsToDelete.forEach(item => {
        addTransaction(item.id, item.name, 'OUT', item.quantity, currentUser?.name || '系統', '批次刪除');
      });
      return prev.filter(item => !ids.includes(item.id));
    });
  };

  const handleDeleteWarehouse = (whName: string, targetWh?: string) => {
    setInventory(prev => prev.map(item => {
      if (item.warehouse === whName) {
        if (targetWh) {
          addTransaction(item.id, item.name, 'IN', 0, currentUser?.name || '系統', `倉區刪除：自動移撥至 ${targetWh}`);
          return { 
            ...item, 
            warehouse: targetWh, 
            lastUpdated: new Date().toISOString().split('T')[0] 
          };
        }
      }
      return item;
    }));
    setWarehouses(prev => prev.filter(w => w !== whName));
  };

  const handleUpdateWarehouseName = (oldName: string, newName: string) => {
    setInventory(prev => prev.map(item => 
      item.warehouse === oldName ? { ...item, warehouse: newName } : item
    ));
    setWarehouses(prev => prev.map(w => w === oldName ? newName : w));
  };

  const handleInitializeSystem = (name: string) => {
    const newAdmin: Staff = {
      id: 's1',
      name: name,
      role: '資深倉管',
      status: 'Active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      lastLogin: new Date().toLocaleDateString()
    };
    setStaff([newAdmin]);
    setCurrentUser(newAdmin);
  };

  const txCategories = [
    { label: '全部', keywords: [] },
    { label: '進貨錄入', keywords: ['錄入', '入庫'] },
    { label: '領料出庫', keywords: ['領料出庫', '領料'] },
    { label: '維修保養', keywords: ['維修', '保養', '送修', '返修'] },
    { label: '移倉調撥', keywords: ['移倉', '移撥'] },
    { label: '異常調整', keywords: ['盤點修正', '調整', '快調', '更新'] },
    { label: '系統刪除', keywords: ['刪除'] },
  ];

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (txFilter !== '全部') {
      const cat = txCategories.find(c => c.label === txFilter);
      if (cat) {
        result = result.filter(t => cat.keywords.some(kw => (t.label || '').includes(kw)));
      }
    }
    return result;
  }, [transactions, txFilter]);

  const handleExportInventory = () => {
    const headers = ['品名', 'SKU', '品類', '庫存量', '單價', '總資產金額', '存放倉區', '最後更新時間'];
    const exportData = inventory.map(item => ({
      '品名': item.name, 'SKU': item.sku, '品類': item.category, '庫存量': item.quantity,
      '單價': item.price, '總資產金額': item.price * item.quantity, '存放倉區': item.warehouse, '最後更新時間': item.lastUpdated
    }));
    exportToCSV(exportData, 'Zenith_庫存報表', headers);
  };

  const exportToCSV = (data: any[], fileName: string, headers: string[]) => {
    const csvRows = [];
    csvRows.push('\uFEFF' + headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return <Login staff={staff} onLogin={setCurrentUser} onInitialize={handleInitializeSystem} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard items={inventory} transactions={transactions} />;
      case 'inventory': return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">庫存實時運籌</h2>
              <p className="text-[10px] text-black font-bold opacity-60 uppercase tracking-widest mt-1">Real-time Stock Operation</p>
            </div>
            <button onClick={handleExportInventory} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg">
              <i data-lucide="download" className="w-4 h-4"></i> 匯出報表
            </button>
          </div>
          <InventoryTable 
            items={inventory} categories={categories} warehouses={warehouses} staff={staff} onUpdateQuantity={handleUpdateQuantity}
            onEditItem={(item) => { setEditingItem(item); setIsModalOpen(true); }}
            onDeleteItem={(item) => { setItemToDelete(item); setIsDeleteConfirmOpen(true); }}
            isModalOpen={isModalOpen} editingItem={editingItem} onCloseModal={() => { setIsModalOpen(false); setEditingItem(null); }}
            onSaveItem={handleSaveItem} 
            onBatchSave={handleBatchSave}
            onUpdateCategory={(old, next) => setCategories(prev => prev.map(c => c === old ? next : c))}
            onAddCategory={(cat) => setCategories(prev => [...prev, cat])} onDeleteCategory={(cat) => setCategories(prev => prev.filter(c => c !== cat))}
            onBatchUpdate={handleBatchUpdate}
            onBatchDelete={handleBatchDelete}
          />
        </div>
      );
      case 'staff': return <StaffManagement staff={staff} onAddStaff={(s) => setStaff(prev => [...prev, s])} onDeleteStaff={(id) => setStaff(prev => prev.filter(m => m.id !== id))} />;
      case 'categories': return <CategoryManagement categories={categories} inventory={inventory} onUpdateCategory={(old, next) => setCategories(prev => prev.map(c => c === old ? next : c))} onAddCategory={(cat) => setCategories(prev => [...prev, cat])} onDeleteCategory={(cat) => setCategories(prev => prev.filter(c => c !== cat))} />;
      case 'warehouses': return <WarehouseManagement warehouses={warehouses} inventory={inventory} onAddWarehouse={(wh) => setWarehouses(prev => [...prev, wh])} onDeleteWarehouse={handleDeleteWarehouse} onUpdateWarehouseName={handleUpdateWarehouseName} />;
      case 'ai': return <AIChat inventory={inventory} transactions={transactions} />;
      case 'transactions':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-3xl font-black text-black uppercase tracking-tight italic">Audit Log</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">庫存異動審核日誌</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
              {txCategories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setTxFilter(cat.label)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
                    txFilter === cat.label 
                    ? 'bg-black text-white shadow-lg scale-105' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-black'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-black">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">流水單號 / 發生時間</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">類型</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">操作標籤</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">品項名稱 [SKU]</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">異動量</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">經辦人員</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map(t => {
                        const labelText = t.label || '';
                        let tagStyles = 'bg-slate-50 text-slate-600 border-slate-100';
                        if (labelText.includes('維修')) {
                          tagStyles = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                        } else if (labelText.includes('錄入')) {
                          tagStyles = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        }

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5">
                              <p className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-black transition-colors">{t.id}</p>
                              <p className="text-[11px] font-black text-black opacity-60 mt-0.5">{t.date}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-tighter ${
                                t.type === 'IN' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {t.type === 'IN' ? 'Stock In +' : 'Stock Out -'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1.5 text-[10px] font-black rounded-xl border uppercase tracking-wider ${tagStyles}`}>
                                {labelText || 'SYSTEM_LOG'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-xs font-black text-black leading-tight max-w-[200px] truncate">{t.itemName}</p>
                            </td>
                            <td className={`px-6 py-5 text-right text-sm font-black font-mono ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'IN' ? '+' : '-'}{t.quantity}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-[12px] italic">{t.operator}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={() => setCurrentUser(null)} lowStockCount={lowStockCount} />
      <main className="flex-1 ml-56 p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
