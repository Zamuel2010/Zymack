import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, RefreshCw } from 'lucide-react';

export default function ExchangeRatesTicker() {
  const [rates, setRates] = useState<{USD?: number, EUR?: number, GBP?: number, BTC?: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/rates');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRates(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && Object.keys(rates).length === 0) {
    return (
      <div className="w-full mb-6 mt-2 flex justify-center">
         <div className="h-10 w-full rounded-xl bg-black/5 dark:bg-white/5 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 mt-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold text-black/50 dark:text-white/50 tracking-wider uppercase flex items-center gap-1.5">
           <TrendingUp size={14} /> Live Exchange Rates
        </h3>
        <button onClick={fetchRates} className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${loading ? 'animate-spin' : ''}`}>
           <RefreshCw size={12} className="text-black/40 dark:text-white/40" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto hidden-scrollbar pb-2">
        {rates.USD && (
          <div className="min-w-[120px] bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-3 shadow-sm flex-shrink-0">
             <div className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1">USD/NGN</div>
             <div className="text-sm font-black text-black dark:text-white">₦{rates.USD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
          </div>
        )}
        {rates.EUR && (
          <div className="min-w-[120px] bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-3 shadow-sm flex-shrink-0">
             <div className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1">EUR/NGN</div>
             <div className="text-sm font-black text-black dark:text-white">₦{rates.EUR.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
          </div>
        )}
        {rates.GBP && (
          <div className="min-w-[120px] bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-3 shadow-sm flex-shrink-0">
             <div className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1">GBP/NGN</div>
             <div className="text-sm font-black text-black dark:text-white">₦{rates.GBP.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
          </div>
        )}
        {rates.BTC && (
          <div className="min-w-[140px] bg-gradient-to-br from-[#F7931A]/20 to-orange-500/5 border border-[#F7931A]/20 rounded-2xl p-3 shadow-sm flex-shrink-0">
             <div className="text-[10px] font-bold text-[#F7931A] dark:text-[#F7931A]/80 mb-1">BTC/NGN</div>
             <div className="text-sm font-black text-black dark:text-white">₦{rates.BTC.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
          </div>
        )}
        {error && Object.keys(rates).length === 0 && (
          <div className="text-xs text-black/40 dark:text-white/40 italic py-2">Unable to load exchange rates.</div>
        )}
      </div>
    </div>
  );
}
