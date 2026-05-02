import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Receipt, CheckCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionReceiptModalProps {
  tx: any;
  onBack: () => void;
}

export default function TransactionReceiptModal({ tx, onBack }: TransactionReceiptModalProps) {
  const isDeposit = tx.type === 'receive' || tx.type === 'deposit';
  
  // Try to derive the rate if not explicitly stored
  let rate = tx.rate;
  if (!rate && tx.cryptoAmount > 0 && tx.amount > 0) {
      rate = tx.amount / tx.cryptoAmount;
  }

  return (
    <div className="w-full h-full bg-[#f6f6f7] dark:bg-[#0a0a0a] flex flex-col transition-colors duration-500">
      <div className="pt-12 pb-4 px-6 flex items-center border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-4"
        >
          <ChevronLeft size={20} className="text-black dark:text-white" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white">Transaction Receipt</h2>
          <p className="text-xs text-black/60 dark:text-white/60">Zymack Premium Receipt</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        
        {/* Receipt Card */}
        <div className="w-full max-w-[360px] bg-white dark:bg-[#111111] rounded-[24px] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden relative">
           
           {/* Top pattern/branding */}
           <div className="h-20 bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-200 relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_black_1px,_transparent_1px)] bg-[size:10px_10px]" />
              <div className="absolute -bottom-6 w-12 h-12 rounded-full bg-white dark:bg-[#111111] flex items-center justify-center border-4 border-white dark:border-[#111111] z-10 shadow-sm">
                 {isDeposit ? 
                    <ArrowDownLeft size={20} className="text-emerald-500" /> : 
                    <ArrowUpRight size={20} className="text-red-500" />
                 }
              </div>
           </div>

           <div className="pt-10 pb-8 px-6 text-center border-b border-dashed border-black/10 dark:border-white/10">
              <h3 className="text-black/60 dark:text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                 {isDeposit ? 'Deposit Received' : 'Withdrawal Sent'}
              </h3>
              <h1 className="text-3xl font-black font-mono tracking-tighter text-black dark:text-white">
                 {isDeposit ? '+' : '-'}₦{tx.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h1>
              {tx.status === 'completed' && (
                 <div className="inline-flex items-center gap-1.5 mt-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                   <CheckCircle size={10} /> Completed
                 </div>
              )}
           </div>

           <div className="p-6 space-y-4 text-sm bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
                <span className="text-black/50 dark:text-white/50 font-medium">Date & Time</span>
                <span className="text-black dark:text-white font-medium text-right">
                   {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              
              {tx.cryptoAmount && (
                <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
                  <span className="text-black/50 dark:text-white/50 font-medium">Crypto Amount</span>
                  <span className="text-black dark:text-white font-bold font-mono">
                     {tx.cryptoAmount} {tx.cryptoAsset?.toUpperCase() || ''}
                  </span>
                </div>
              )}

              {rate && (
                <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
                  <span className="text-black/50 dark:text-white/50 font-medium">Exchange Rate</span>
                  <span className="text-black dark:text-white font-mono">
                     ~₦{rate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / {tx.cryptoAsset?.toUpperCase() || 'Asset'}
                  </span>
                </div>
              )}

              {tx.txId && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-black/50 dark:text-white/50 font-medium">Tx Hash (ID)</span>
                  <span className="text-black dark:text-white font-mono text-[10px] truncate max-w-[150px]" title={tx.txId}>
                     {tx.txId}
                  </span>
                </div>
              )}
           </div>

           {/* Zig zag bottom edge effect */}
           <div className="h-4 w-full relative overflow-hidden flex" style={{ background: 'transparent' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                 <div key={i} className="w-4 h-4 bg-[#f6f6f7] dark:bg-[#0a0a0a] transform rotate-45 -translate-y-2 translate-x-1/2"></div>
              ))}
           </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-black/30 dark:text-white/30 font-medium text-xs">
           <Receipt size={14} /> Powered by Zymack
        </div>
      </div>
    </div>
  );
}
