
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { InventoryItem, Transaction } from '../types';

interface DashboardProps {
  items: InventoryItem[];
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions }) => {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum: number, item) => sum + (item.price * item.quantity), 0);
    const lowStockCount = items.filter(item => item.quantity < item.minThreshold).length;

    const lastTx = transactions[0];
    const lastValueDelta = lastTx ? (lastTx.quantity * (lastTx.priceAtTime || 0)) : 0;
    const lastTxType = lastTx?.type || 'IN';

    const categoryValueMap = items.reduce((acc, item) => {
      const val = item.price * item.quantity;
      acc[item.category] = (acc[item.category] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    const categoryValueData = Object.entries(categoryValueMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));

    const warehouseValueMap = items.reduce((acc, item) => {
      const val = item.price * item.quantity;
      acc[item.warehouse] = (acc[item.warehouse] || 0) + val;
      return acc;
    }, {} as Record<string, number>);

    const warehouseValueData = Object.entries(warehouseValueMap).map(([name, value]) => ({ name, value }));

    return { totalItems, totalValue, lowStockCount, categoryValueData, warehouseValueData, lastValueDelta, lastTxType };
  }, [items, transactions]);

  const VIBRANT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataColor = payload[0].payload.fill || payload[0].color;
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border-2 transition-all duration-300" style={{ borderColor: dataColor }}>
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{label || payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dataColor }}></div>
            <p className="text-base font-black text-black font-mono">{formatCurrency(payload[0].value)}</p>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase">
            佔比: {((payload[0].value / stats.totalValue) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-black tracking-tighter uppercase italic">資產運籌中心</h2>
          <p className="text-[13px] font-bold text-black opacity-40 mt-1.5 uppercase tracking-[0.3em]">Advanced Inventory Valuation Dashboard</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-2 justify-end">
             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <p className="text-[12px] font-black text-black uppercase tracking-widest">系統運行中</p>
          </div>
          <p className="text-sm font-black text-black mt-1 font-mono tracking-tighter opacity-70">
            {new Date().toLocaleDateString('zh-TW')} {new Date().toLocaleTimeString('zh-TW', { hour12: false })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: 'package', label: '庫存品項總數', val: stats.totalItems, unit: 'SKUs', color: 'slate' },
          { 
            icon: 'banknote', 
            label: '庫存資產總值', 
            val: formatCurrency(stats.totalValue), 
            unit: 'TWD', 
            color: 'indigo',
            extra: stats.lastValueDelta !== 0 && (
              <div className={`mt-2 flex items-center gap-1 text-[10px] font-black uppercase ${stats.lastTxType === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                <i data-lucide={stats.lastTxType === 'IN' ? 'trending-up' : 'trending-down'} className="w-3 h-3"></i>
                最新變動: {stats.lastTxType === 'IN' ? '+' : '-'}{formatCurrency(stats.lastValueDelta)}
              </div>
            )
          },
          { icon: 'alert-triangle', label: '低水位警告', val: stats.lowStockCount, unit: '項需補貨', color: stats.lowStockCount > 0 ? 'rose' : 'emerald' }
        ].map((c, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-7 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
            <div className="w-20 h-20 bg-slate-50 group-hover:bg-black group-hover:text-white transition-all duration-500 rounded-[2rem] flex items-center justify-center text-slate-900 z-10">
              <i data-lucide={c.icon} className="w-10 h-10"></i>
            </div>
            <div className="z-10">
              <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.25em] mb-1.5">{c.label}</p>
              <h3 className="text-3xl font-black text-black font-mono leading-none">
                {c.val} <span className="text-[12px] font-black text-slate-300 ml-1.5 uppercase">{c.unit}</span>
              </h3>
              {c.extra}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <i data-lucide={c.icon} className="w-40 h-40 text-black"></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
              <h4 className="text-lg font-black text-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-7 bg-indigo-600 rounded-full"></span>
                品類資產權重
              </h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase mt-1.5 ml-5 tracking-widest">Asset Valuation by Category</p>
            </div>
          </div>
          
          <div className="h-[400px] flex items-center relative z-10">
            <div className="flex-[1.5] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.categoryValueData} 
                    cx="50%" cy="50%" 
                    innerRadius={90} outerRadius={140} 
                    paddingAngle={6} dataKey="value" 
                    stroke="none"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {stats.categoryValueData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[11px] font-black text-slate-400 uppercase">總資產</p>
                <p className="text-base font-black text-black font-mono">100%</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-5 pl-10 border-l border-slate-50 max-h-[350px] overflow-y-auto no-scrollbar">
              {stats.categoryValueData.map((cat, i) => (
                <div key={cat.name} className="flex flex-col group/item cursor-default">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: VIBRANT_COLORS[i % VIBRANT_COLORS.length]}}></div>
                      <span className="text-sm font-black text-black truncate uppercase tracking-tighter group-hover/item:translate-x-1 transition-transform">{cat.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {((cat.value / stats.totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${(cat.value / stats.totalValue) * 100}%`, backgroundColor: VIBRANT_COLORS[i % VIBRANT_COLORS.length] }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h4 className="text-lg font-black text-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-7 bg-emerald-500 rounded-full"></span>
                倉區儲值分佈
              </h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase mt-1.5 ml-5 tracking-widest">Asset Distribution by Warehouse</p>
            </div>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.warehouseValueData} layout="vertical" margin={{ left: 30, right: 80, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 15, fontWeight: 900}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 15 }} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 20, 20, 0]} 
                  barSize={50}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {stats.warehouseValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[(index + 3) % VIBRANT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-10 border-t border-slate-50 flex justify-around">
             {stats.warehouseValueData.map((wh, i) => (
               <div key={wh.name} className="text-center group cursor-default">
                 <div className="flex items-center justify-center gap-2 mb-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: VIBRANT_COLORS[(i + 3) % VIBRANT_COLORS.length] }}></div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{wh.name} 倉</p>
                 </div>
                 <p className="text-xl font-black text-black font-mono group-hover:scale-110 transition-transform">{formatCurrency(wh.value)}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
