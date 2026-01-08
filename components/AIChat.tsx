
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { InventoryItem, Transaction } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatProps {
  inventory: InventoryItem[];
  transactions: Transaction[];
}

const AIChat: React.FC<AIChatProps> = ({ inventory, transactions }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: '您好！我是您的智慧倉管顧問。我已經讀取了所有庫存資料。今天有什麼我可以幫您的？點選下方按鈕可以快速分析喔！' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }, [messages]);

  const handleSend = async (customQuery?: string) => {
    const userMsg = customQuery || input.trim();
    if (!userMsg || isLoading) return;

    if (!customQuery) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await geminiService.getInventoryInsights(inventory, transactions, userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: result || '分析完畢，暫無異常。' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: '抱歉，我現在有點忙，請等我一下再問我。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: '🚩 哪些東西快沒了？', query: '請幫我列出目前低於安全水位的商品。' },
    { label: '📊 倉庫現在值多少錢？', query: '請計算目前的庫存總價值，並分析資金主要壓在哪些品項。' },
    { label: '💡 給我一些補貨建議', query: '根據目前庫存，建議我優先採購哪些商品？' },
    { label: '🏢 倉區利用率分析', query: '目前各個倉區的貨物分佈如何？哪個倉庫最滿？' }
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-black text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i data-lucide="sparkles" className="w-7 h-7"></i>
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">ZENITH AI 智慧顧問</h3>
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">您的專屬數據分析師</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-black text-white rounded-br-none shadow-xl' 
              : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'
            }`}>
              <div className="prose prose-sm max-w-none">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 rounded-bl-none flex gap-3 items-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正在分析倉庫數據...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Area */}
      <div className="p-6 bg-white border-t border-slate-50 space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(action.query)}
              className="px-5 py-3 bg-slate-50 border border-slate-100 hover:border-black rounded-2xl text-[11px] font-black text-black whitespace-nowrap transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-black transition-all"
            placeholder="或是直接輸入您的問題..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-black text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-20 shadow-xl"
          >
            <i data-lucide="send" className="w-6 h-6"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
