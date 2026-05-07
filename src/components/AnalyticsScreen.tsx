import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Smartphone, Tv, CreditCard, Send } from 'lucide-react';

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export default function AnalyticsScreen({ transactions, balance }: { transactions: any[], balance: number }) {
  const data = useMemo(() => {
    let moneyIn = 0;
    let moneyOut = 0;
    let breakdown = {
      Transfers: 0,
      Cards: 0,
      Airtime: 0,
      Data: 0,
      TV: 0,
      Electricity: 0,
      Other: 0
    };

    transactions.forEach(tx => {
      if (tx.type === 'credit') {
        moneyIn += tx.amount;
      } else if (tx.type === 'debit') {
        moneyOut += tx.amount;
        
        // Categorize debit
        let desc = (tx.description || '').toLowerCase();
        let cat = (tx.category || '').toLowerCase();
        
        if (cat === 'transfer' || desc.includes('transfer')) breakdown.Transfers += tx.amount;
        else if (cat === 'card' || desc.includes('card')) breakdown.Cards += tx.amount;
        else if (cat === 'airtime' || desc.includes('airtime')) breakdown.Airtime += tx.amount;
        else if (cat === 'data' || desc.includes('data')) breakdown.Data += tx.amount;
        else if (cat === 'tv' || desc.includes('tv') || desc.includes('dstv') || desc.includes('gotv')) breakdown.TV += tx.amount;
        else if (cat === 'electricity' || desc.includes('power')) breakdown.Electricity += tx.amount;
        else breakdown.Other += tx.amount;
      }
    });

    const chartData = [
      { name: 'Transfers', value: breakdown.Transfers, color: '#3b82f6', icon: <Send size={16} /> },
      { name: 'Cards', value: breakdown.Cards, color: '#10b981', icon: <CreditCard size={16} /> },
      { name: 'Airtime', value: breakdown.Airtime, color: '#f59e0b', icon: <Smartphone size={16} /> },
      { name: 'Data', value: breakdown.Data, color: '#14b8a6', icon: <Smartphone size={16} /> },
      { name: 'TV', value: breakdown.TV, color: '#8b5cf6', icon: <Tv size={16} /> },
      { name: 'Electricity', value: breakdown.Electricity, color: '#eab308', icon: <TrendingUp size={16} /> },
      { name: 'Other', value: breakdown.Other, color: '#6b7280', icon: <TrendingUp size={16} /> }
    ].filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    return { moneyIn, moneyOut, chartData };
  }, [transactions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col pb-6 w-full"
    >
      <div className="mb-6 mt-4">
        <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Analytics</h2>
        <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-1">Insights into your spending habits.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-emerald-500/10 p-5 rounded-3xl flex flex-col justify-center">
            <div className="w-8 h-8 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
              <ArrowDownLeft size={16} />
            </div>
            <p className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-1">Money In</p>
            <h3 className="text-xl font-black text-black dark:text-white">{formatNaira(data.moneyIn)}</h3>
         </div>
         <div className="bg-red-500/10 p-5 rounded-3xl flex flex-col justify-center">
            <div className="w-8 h-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-3">
              <ArrowUpRight size={16} />
            </div>
            <p className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-1">Money Out</p>
            <h3 className="text-xl font-black text-black dark:text-white">{formatNaira(data.moneyOut)}</h3>
         </div>
      </div>

      {data.chartData.length > 0 ? (
        <>
          <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl mb-8">
            <h3 className="text-sm font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-6 text-center">Spending Breakdown</h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatNaira(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#111', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Total</span>
                 <span className="text-lg font-black text-black dark:text-white mt-0.5">{formatNaira(data.moneyOut)}</span>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-sm font-bold text-black/90 dark:text-white/90 mb-4">Categories</h3>
             <div className="space-y-3 relative pb-[5.5rem]">
               {data.chartData.map((item, i) => {
                 const percentage = Math.round((item.value / data.moneyOut) * 100) || 0;
                 return (
                   <div key={i} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: item.color }}>
                            {item.icon}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-black/90 dark:text-white/90">{item.name}</p>
                            <p className="text-xs font-semibold text-black/40 dark:text-white/40 mt-0.5">{percentage}% of spending</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-black dark:text-white">{formatNaira(item.value)}</p>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-black/5 dark:bg-white/5 rounded-3xl">
           <div className="w-16 h-16 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 text-black/30 dark:text-white/30">
              <TrendingUp size={32} />
           </div>
           <h3 className="text-lg font-black text-black/90 dark:text-white/90">No Data Yet</h3>
           <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-1 max-w-[200px]">Make transactions to see your spending insights.</p>
        </div>
      )}
    </motion.div>
  );
}
