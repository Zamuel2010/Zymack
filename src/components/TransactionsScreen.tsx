import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import dayjs from 'dayjs';

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export default function TransactionsScreen({ transactions, onBack, onSelectTx }: { transactions: any[], onBack: () => void, onSelectTx: (tx: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredTxs = transactions.filter(tx => {
    // Search
    const matchesSearch = 
        (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.amount || '').toString().includes(searchQuery);
    
    // Filter
    const matchesFilter = filterType ? tx.type === filterType : true;

    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="absolute inset-0 bg-[#F5F5F7] dark:bg-[#050505] z-50 overflow-y-auto flex flex-col"
    >
        <div className="sticky top-0 bg-[#F5F5F7]/90 dark:bg-[#050505]/90 backdrop-blur-xl z-20 px-6 pt-10 pb-4 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center mb-6 max-w-[480px] mx-auto w-full">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
              </button>
              <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">History</h2>
            </div>
            
            <div className="max-w-[480px] mx-auto w-full space-y-4">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                    <input 
                       type="text"
                       placeholder="Search transactions..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full bg-black/5 dark:bg-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-none border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button 
                       onClick={() => setFilterType(null)}
                       className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterType === null ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60'}`}
                    >
                       All Transactions
                    </button>
                    <button 
                       onClick={() => setFilterType('credit')}
                       className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'credit' ? 'bg-emerald-500 text-white' : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60'}`}
                    >
                       <ArrowDownLeft size={14} /> Money In
                    </button>
                    <button 
                       onClick={() => setFilterType('debit')}
                       className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'debit' ? 'bg-red-500 text-white' : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60'}`}
                    >
                       <ArrowUpRight size={14} /> Money Out
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 px-6 pt-6 pb-20 max-w-[480px] mx-auto w-full">
            <div className="flex flex-col gap-3">
              {filteredTxs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Search size={32} className="mb-3 text-black/40 dark:text-white/40" />
                  <p className="text-sm font-bold text-black dark:text-white">No exact matches</p>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">Try changing your search or filter.</p>
                </div>
              ) : (
                filteredTxs.map((tx, i) => (
                  <motion.div 
                    onClick={() => onSelectTx(tx)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={tx.id} 
                    className="flex justify-between items-center p-4 bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-[20px] transition-colors duration-500 cursor-pointer hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {tx.type === 'credit' ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <ArrowDownLeft size={20} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                          <ArrowUpRight size={20} strokeWidth={2.5} />
                        </div>
                      )}
                      <div>
                        {tx.isRead === false && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 left-4 border border-white dark:border-[#111]"></div>
                        )}
                        <h4 className="font-bold text-[15px] text-black/90 dark:text-white/90 truncate max-w-[120px] sm:max-w-[180px] transition-colors duration-500">{tx.description}</h4>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-black/40 dark:text-white/40 mt-0.5 transition-colors duration-500">
                           {dayjs(tx.createdAt).format('MMM D, h:mm A')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black tracking-tight text-base transition-colors duration-500 ${tx.type === 'credit' ? 'text-emerald-500' : 'text-black dark:text-white'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 mt-0.5 transition-colors duration-500">{tx.category}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
        </div>
    </motion.div>
  );
}
