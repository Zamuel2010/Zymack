import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { Search, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminPanel({ isDarkMode }: { isDarkMode: boolean }) {
  const [targetUid, setTargetUid] = useState('');
  const [txHash, setTxHash] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDC');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forceSkip, setForceSkip] = useState(false);

  const getFiatRate = async (asset: string) => {
    try {
       const cgResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,bitcoin,ethereum,solana,binancecoin,tron,ripple,cardano,dogecoin,shiba-inu&vs_currencies=ngn");
       const cgData = await cgResp.json();
       const rates: Record<string, number> = {
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
       };
       return rates[asset.toUpperCase()] || 1200;
    } catch(e) {
       console.error("CoinGecko failed", e);
       return 1200; // Fallback
    }
  };

  const handleManualCredit = async () => {
    if (!targetUid || !cryptoAmount || !cryptoAsset) {
      setMessage("Error: Please fill UID, Asset and Amount.");
      return;
    }
    
    if (!forceSkip && !txHash) {
      setMessage("Error: Transaction Hash required unless 'Skip Verification' is checked.");
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const finalTxHash = txHash || `manual-${Date.now()}`;
    
    try {
      if (!forceSkip) {
        // 1. Verify exact Transaction ID on Blockchain via our server
        const verifyRes = await fetch("/api/admin/verify-tx", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ txId: finalTxHash, asset: cryptoAsset })
        });
        
        if (!verifyRes.ok) {
           setLoading(false);
           const resData = await verifyRes.json().catch(() => ({}));
           setMessage(`Error: ${resData.error || "Transaction not found on the blockchain."}`);
           return;
        }
      }

      // 2. Prevent Double Credit 
      // Query user's transactions to see if this txHash already exists
      const txsRef = collection(db, 'wallets', targetUid, 'transactions');
      const q = query(txsRef, where("txId", "==", finalTxHash));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
         setLoading(false);
         setMessage("Error: Transaction has already been credited.");
         return;
      }

      // 3. Process Credit
      const walletRef = doc(db, 'wallets', targetUid);
      const walletSnap = await getDoc(walletRef);
      let currentBalance = walletSnap.exists() ? (walletSnap.data().totalBalance || 0) : 0;
      
      // Calculate Fiat value based on current real rate
      const rate = await getFiatRate(cryptoAsset);
      const fiatValue = parseFloat(cryptoAmount) * rate;
      currentBalance += fiatValue;

      const txRef = doc(txsRef, finalTxHash);
      await setDoc(txRef, {
         type: 'deposit',
         amount: fiatValue, 
         cryptoAmount: parseFloat(cryptoAmount),
         cryptoAsset: cryptoAsset.toUpperCase(),
         status: 'completed',
         title: `Deposit ${cryptoAsset.toUpperCase()}`,
         createdAt: new Date().toISOString(),
         txId: finalTxHash,
         isRead: false
      });
      
      await setDoc(walletRef, { totalBalance: currentBalance }, { merge: true });
      setMessage(forceSkip ? "Success: Force Credited without Verification!" : "Success: Transaction Verified & Credited!");
      setTxHash('');
      setCryptoAmount('');
    } catch(e) {
      console.error(e);
      setMessage("Error: Failed to process credit. Verify UID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-black dark:text-white mb-6">Admin Dashboard</h2>
      
      <div className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-black dark:text-white mb-4">Verify & Push Missing Deposit</h3>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6 font-medium leading-relaxed">
          The system will verify the TX Hash on the blockchain before crediting. It will automatically convert the crypto amount to NGN using live rates.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">User UID</label>
            <input 
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="Paste user UID..."
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
            />
          </div>
          
          <div>
             <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">Transaction Hash (TX ID)</label>
             <input 
               value={txHash}
               onChange={(e) => setTxHash(e.target.value)}
               placeholder="Paste transaction hash..."
               className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
             />
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
               <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">Asset (e.g. SOL)</label>
               <input 
                 value={cryptoAsset}
                 onChange={(e) => setCryptoAsset(e.target.value)}
                 placeholder="SOL, USDC, DOGE..."
                 className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm uppercase text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
               />
             </div>
             <div className="flex-1">
               <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">Crypto Amount</label>
               <input 
                 value={cryptoAmount}
                 onChange={(e) => setCryptoAmount(e.target.value)}
                 placeholder="0.1"
                 type="number"
                 className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
               />
             </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="forceSkip" 
              checked={forceSkip} 
              onChange={(e) => setForceSkip(e.target.checked)}
              className="w-4 h-4 rounded border-black/20 dark:border-white/20 text-black dark:text-white"
            />
            <label htmlFor="forceSkip" className="text-xs font-medium text-black/80 dark:text-white/80 cursor-pointer">
              Skip Blockchain Verification (Force Credit)
            </label>
          </div>

          <button 
            disabled={loading}
            onClick={handleManualCredit}
            className={`w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-xl hover:bg-black/80 dark:hover:bg-white/80 transition-colors flex justify-center items-center gap-2 mt-4 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            {loading ? 'Processing...' : forceSkip ? 'Force Push Credit' : 'Verify & Push'}
          </button>
          
          {message && (
            <div className={`mt-4 text-sm font-medium p-3 rounded-xl flex items-center gap-2 ${message.includes("Error") ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
              <CheckCircle size={16} />
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
