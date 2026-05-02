import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Calculator as CalcIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CalculatorModalProps {
  onBack: () => void;
  uid: string;
}

export default function CalculatorModal({ onBack, uid }: CalculatorModalProps) {
  const [asset, setAsset] = useState('SOL');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [hasPreviousWithdrawals, setHasPreviousWithdrawals] = useState(false);

  useEffect(() => {
    // Check if user has previous withdrawals
    const checkWithdrawals = async () => {
       const txsRef = collection(db, 'wallets', uid, 'transactions');
       const q = query(txsRef, where("type", "==", "withdrawal"));
       const snap = await getDocs(q);
       setHasPreviousWithdrawals(!snap.empty);
    };
    checkWithdrawals();

    const fetchRates = async () => {
       try {
          const cgResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,bitcoin,ethereum,solana,binancecoin,tron,ripple,cardano,dogecoin,shiba-inu&vs_currencies=ngn");
          const cgData = await cgResp.json();
          setRates({
             'BTC': cgData.bitcoin?.ngn || 100000000,
             'ETH': cgData.ethereum?.ngn || 5000000,
             'SOL': cgData.solana?.ngn || 250000,
             'BNB': cgData.binancecoin?.ngn || 800000,
             'TRON': cgData.tron?.ngn || 200,
             'USDT': cgData.tether?.ngn || 1600,
             'USDC': cgData['usd-coin']?.ngn || 1600,
             'XRP': cgData.ripple?.ngn || 800,
             'ADA': cgData.cardano?.ngn || 700,
             'DOGE': cgData.dogecoin?.ngn || 200,
             'SHIB': cgData['shiba-inu']?.ngn || 0.03
          });
       } catch(e) {
          console.error("Failed to load rates", e);
       }
    };
    fetchRates();
  }, [uid]);

  const numAmount = parseFloat(amount) || 0;
  const currentRate = rates[asset] || 0;
  const rawFiat = numAmount * currentRate;
  
  // Service fee: 1.5%, first withdrawal is free
  const feePercentage = hasPreviousWithdrawals ? 0.015 : 0;
  const serviceFee = rawFiat * feePercentage;
  const userTotal = rawFiat - serviceFee;

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
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <CalcIcon size={18} /> Payout Calculator
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">Estimate your withdrawal value in NGN</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
           
           <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2">Select Asset</label>
              <select 
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
              >
                 {Object.keys(rates).sort().map(k => (
                   <option key={k} value={k}>{k}</option>
                 ))}
                 {Object.keys(rates).length === 0 && <option value="SOL">SOL</option>}
              </select>
           </div>

           <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2">Enter Crypto Amount</label>
              <input 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 0.5"
                type="number"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
              />
           </div>

           <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-black/60 dark:text-white/60">Current Rate ({asset}/NGN)</span>
                <span className="font-mono font-medium text-black dark:text-white">₦{currentRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-black/60 dark:text-white/60">Gross Value</span>
                <span className="font-mono font-medium text-black dark:text-white">₦{rawFiat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-black/60 dark:text-white/60">
                   Service Fee (1.5%)
                   {!hasPreviousWithdrawals && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">FIRST FREE</span>}
                </span>
                <span className="font-mono font-medium text-red-500">-₦{serviceFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5">
                <span className="font-bold text-black dark:text-white font-medium">Estimated Payout</span>
                <span className="font-black text-xl text-black dark:text-white font-mono tracking-tight">₦{userTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
