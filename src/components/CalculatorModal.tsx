import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Calculator as CalcIcon, DollarSign, ArrowDown, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CalculatorModalProps {
  onBack: () => void;
  uid: string;
}

const CRYPTOS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
  { id: 'usdt', name: 'Tether US', symbol: 'USDT', iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', iconUrl: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.svg' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', iconUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg' },
  { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', iconUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg' },
];

export default function CalculatorModal({ onBack, uid }: CalculatorModalProps) {
  const [assetSymbol, setAssetSymbol] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const currentRate = rates[assetSymbol] || 0;
  const rawFiat = numAmount * currentRate;
  
  // Service fee: 1.5% fixed
  const feePercentage = 0.015;
  const serviceFee = rawFiat * feePercentage;
  const userTotal = rawFiat - serviceFee;

  const selectedCrypto = CRYPTOS.find(c => c.symbol === assetSymbol) || CRYPTOS.find(c => c.symbol === 'USDT')!;

  return (
    <div className="w-full h-full bg-[#f6f6f7] dark:bg-[#0a0a0a] flex flex-col transition-colors duration-500 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-500/10 to-transparent dark:from-blue-500/5 pointer-events-none" />

      <div className="pt-12 pb-4 px-6 flex items-center bg-transparent backdrop-blur-xl shrink-0 z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-4"
        >
          <ChevronLeft size={20} className="text-black dark:text-white" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <CalcIcon size={18} /> Conversion Calculator
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">Estimate your deposits in NGN</p>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto z-10">
        {/* Main Calculator Card */}
        <div className="bg-white dark:bg-[#111111] rounded-3xl border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 overflow-hidden">
           
           <div className="p-6 pb-8 border-b border-black/5 dark:border-white/5">
              <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-3">You Send</label>
              
              <div className="flex flex-col gap-4">
                  <div className="relative">
                      <button 
                         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                         className="w-full bg-[#f8f9fa] dark:bg-white/5 border-none rounded-2xl p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                      >
                         <div className="flex items-center gap-3">
                             <img src={selectedCrypto.iconUrl} alt={selectedCrypto.name} className="w-8 h-8 rounded-full" />
                             <div className="text-left">
                                <h3 className="font-bold text-black dark:text-white leading-tight">{selectedCrypto.symbol}</h3>
                                <p className="text-[10px] uppercase font-bold text-black/40 dark:text-white/40 tracking-wider m-0">{selectedCrypto.name}</p>
                             </div>
                         </div>
                         <ChevronLeft size={20} className={`text-black/40 dark:text-white/40 transition-transform ${isDropdownOpen ? '-rotate-90' : 'rotate-180'}`} />
                      </button>

                      <AnimatePresence>
                         {isDropdownOpen && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl z-20 max-h-64 overflow-y-auto py-2"
                             >
                                {CRYPTOS.map(crypto => (
                                    <button
                                      key={crypto.id}
                                      onClick={() => { setAssetSymbol(crypto.symbol); setIsDropdownOpen(false); }}
                                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                       <img src={crypto.iconUrl} alt={crypto.name} className="w-6 h-6 rounded-full" />
                                       <span className="font-bold text-sm text-black dark:text-white">{crypto.symbol}</span>
                                       <span className="text-xs text-black/40 dark:text-white/40 ml-auto">{crypto.name}</span>
                                    </button>
                                ))}
                             </motion.div>
                         )}
                      </AnimatePresence>
                  </div>

                  <div className="relative">
                      <input 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        type="number"
                        className="w-full bg-[#f8f9fa] dark:bg-white/5 border-none rounded-2xl p-6 text-3xl font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center tracking-tight"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-black/30 dark:text-white/30 text-xl">
                          {selectedCrypto.symbol}
                      </div>
                  </div>
              </div>
           </div>

           {/* Conversion Indicator */}
           <div className="relative flex justify-center -mt-6 z-10">
               <div className="bg-white dark:bg-[#111] p-2 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
                   <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                       <ArrowDown size={18} />
                   </div>
               </div>
           </div>

           <div className="p-6 pt-4 space-y-6">
              <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-3">You Receive (Estimated)</label>
                  <div className="bg-[#f8f9fa] dark:bg-white/5 border-none rounded-2xl p-6 flex items-center justify-center">
                     <span className="text-3xl font-black text-emerald-500 tracking-tight">
                         ₦{userTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                     </span>
                  </div>
              </div>

              <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-black/60 dark:text-white/60 flex items-center gap-1.5">
                       <RefreshCw size={14} /> Current Rate
                    </span>
                    <span className="font-bold text-black dark:text-white">1 {assetSymbol} ≈ ₦{currentRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-black/60 dark:text-white/60">Gross Value</span>
                    <span className="font-bold text-black dark:text-white">₦{rawFiat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-4 border-t border-black/5 dark:border-white/10">
                    <span className="font-medium text-black/60 dark:text-white/60 flex items-center gap-2">
                       Processing Fee
                       <span className="text-[10px] bg-black/10 dark:bg-white/10 text-black dark:text-white px-1.5 py-0.5 rounded font-bold">1.5%</span>
                    </span>
                    <span className="font-bold text-red-500">- ₦{serviceFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
