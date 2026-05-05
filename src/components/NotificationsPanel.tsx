import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, Search, Filter, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface NotificationsPanelProps {
  onBack: () => void;
  transactions: any[];
  isDarkMode: boolean;
  uid: string;
  onSelectTx?: (tx: any) => void;
}

export default function NotificationsPanel({ onBack, transactions, isDarkMode, uid, onSelectTx }: NotificationsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    // Less than 24 hours
    if (diff < 86400000) {
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      return `${Math.floor(diff / 3600000)}h ago`;
    }
    
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleDelete = async (e: React.MouseEvent, txId: string) => {
     e.stopPropagation();
     try {
         await deleteDoc(doc(db, 'wallets', uid, 'transactions', txId));
     } catch(err) {
         console.error("Failed to delete notification", err);
     }
  };

  const filteredTransactions = useMemo(() => {
     return transactions.filter(tx => {
         const matchesSearch = (tx.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                               (tx.amount || '').toString().includes(searchQuery) ||
                               (tx.txId || '').toLowerCase().includes(searchQuery.toLowerCase());
         
         const isDeposit = tx.type === 'receive' || tx.type === 'deposit';
         const isWithdrawal = tx.type === 'send' || tx.type === 'withdraw';
         
         const matchesFilter = filterType === 'all' 
             || (filterType === 'deposit' && isDeposit) 
             || (filterType === 'withdrawal' && isWithdrawal);
             
         return matchesSearch && matchesFilter;
     });
  }, [transactions, searchQuery, filterType]);

  return (
    <div className="absolute inset-0 bg-[#F5F5F7] dark:bg-[#0A0A0A] z-50 flex flex-col overflow-hidden transition-colors duration-500">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      
      {/* Header */}
      <div className="flex flex-col px-6 pt-12 pb-4 relative z-10 w-full bg-[#F5F5F7]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-black/90 dark:text-white/90 ml-4">
            Notifications
          </h2>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 items-center">
            <div className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Search size={16} className="text-black/40 dark:text-white/40" />
                <input 
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search..."
                   className="bg-transparent border-none outline-none text-sm text-black dark:text-white w-full placeholder:text-black/30 dark:placeholder:text-white/30"
                />
            </div>
            
            <button 
                onClick={() => setFilterType(prev => prev === 'all' ? 'deposit' : prev === 'deposit' ? 'withdrawal' : 'all')}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 transition-colors relative"
            >
                <Filter size={16} className={filterType !== 'all' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'} />
                {filterType !== 'all' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
                )}
            </button>
        </div>
        
        {/* Filter Indicator Display */}
        {filterType !== 'all' && (
           <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                 Showing: {filterType}s
              </span>
              <button 
                 onClick={() => setFilterType('all')} 
                 className="text-[10px] font-bold text-black/50 dark:text-white/50 underline"
              >
                 Clear
              </button>
           </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-20 overflow-y-auto hidden-scrollbar relative z-10">
        <div className="flex flex-col gap-3 pt-2">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                <Clock size={24} className="text-black/40 dark:text-white/40" />
              </div>
              <p className="text-sm font-medium text-black dark:text-white">
                 {searchQuery || filterType !== 'all' ? 'No matches found' : 'No notifications'}
              </p>
              <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                 {searchQuery || filterType !== 'all' ? 'Try a different search term or filter.' : 'Your recent activity will appear here.'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx, i) => (
              <motion.div 
                onClick={() => onSelectTx && onSelectTx(tx)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={tx.id}
                className={`flex flex-col p-4 rounded-2xl border transition-colors cursor-pointer ${
                   tx.isRead 
                     ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.05]' 
                     : 'bg-white dark:bg-[#111111] border-black/10 dark:border-white/10 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'receive' || tx.type === 'deposit' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'receive' || tx.type === 'deposit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black/90 dark:text-white/90">
                        {tx.title || (tx.type === 'receive' ? 'Deposit Received' : 'Withdrawal')}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.status === 'completed' || tx.status === 'success' ? (
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        ) : tx.status === 'pending' ? (
                          <Clock size={10} className="text-amber-500" />
                        ) : (
                          <XCircle size={10} className="text-red-500" />
                        )}
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${
                          tx.status === 'completed' || tx.status === 'success' ? 'text-emerald-500' :
                          tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {tx.status || 'Success'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-black/40 dark:text-white/40">
                    {formatDate(tx.createdAt || new Date().toISOString())}
                  </span>
                </div>
                
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex justify-between items-center mt-1 group">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-black/60 dark:text-white/60">Amount</span>
                    {tx.txId && (
                      <span className="text-[9px] font-mono text-black/40 dark:text-white/40 max-w-[150px] truncate" title={tx.txId}>
                        TX: {tx.txId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                       onClick={(e) => handleDelete(e, tx.id)}
                       className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                       title="Delete Notification"
                    >
                       <Trash2 size={14} />
                    </button>
                    <div className="text-right">
                      <div className="font-bold text-sm text-black dark:text-white">
                        {tx.amount ? `₦${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                      </div>
                      {tx.cryptoAmount && tx.cryptoAsset && (
                        <div className="text-[10px] text-black/50 dark:text-white/50">
                          {tx.cryptoAmount} {tx.cryptoAsset?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
