import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, query, where, getDocs, collection, updateDoc, orderBy } from 'firebase/firestore';
import { Search, PlusCircle, CheckCircle, Loader2, ShieldAlert, User as UserIcon, Wallet, Activity, Ban, Settings2, RefreshCw, XCircle } from 'lucide-react';

export default function AdminPanel({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'credit' | 'users'>('users');
  
  // Tab: Credit
  const [targetUid, setTargetUid] = useState('');
  const [txHash, setTxHash] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDC');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forceSkip, setForceSkip] = useState(false);

  // Tab: Users
  const [searchUid, setSearchUid] = useState('');
  const [searchTx, setSearchTx] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState('');
  
  const [newBalance, setNewBalance] = useState('');

  // -------------------------
  // CREDIT TAB
  // -------------------------
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

  // -------------------------
  // USER TAB
  // -------------------------
  const handleSearchUser = async () => {
    let targetId = searchUid.trim();
    if (!targetId && !searchTx.trim()) {
       setUserMessage("Error: Please provide a UID or TX ID.");
       return;
    }
    
    setUserLoading(true);
    setUserMessage('');
    setUserData(null);
    setWalletData(null);
    setUserTransactions([]);
    
    try {
      if (searchTx.trim()) {
         // Special case: we need to find the user via TX ID 
         // Since we don't have collectionGroup easily indexed right now for all wallets,
         // We might only be able to search if we know the user UID. But let's check current user if searchUid is present
         if (!searchUid.trim()) {
            setUserMessage("Error: TX Search requires User UID context currently.");
            setUserLoading(false);
            return;
         }
      }

      // Fetch User Doc
      const uRef = doc(db, 'users', targetId);
      const uSnap = await getDoc(uRef);
      if (uSnap.exists()) {
         setUserData({ id: uSnap.id, ...uSnap.data() });
      } else {
         setUserMessage("Error: User document not found.");
         setUserLoading(false);
         return;
      }

      // Fetch Wallet
      const wRef = doc(db, 'wallets', targetId);
      const wSnap = await getDoc(wRef);
      if (wSnap.exists()) {
         setWalletData(wSnap.data());
      } else {
         setWalletData({ totalBalance: 0, currency: 'NGN' }); // Default assumption
      }

      // Fetch TXs
      const txsRef = collection(db, 'wallets', targetId, 'transactions');
      let qTx = searchTx.trim() ? query(txsRef, where("txId", "==", searchTx.trim())) : query(txsRef);
      const txSnap = await getDocs(qTx);
      
      const txs: any[] = [];
      txSnap.forEach(d => txs.push({ ...d.data(), id: d.id }));
      
      // Sort in memory instead of requiring index
      txs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setUserTransactions(txs);
      
    } catch(e) {
      console.error(e);
      setUserMessage("Error: Search failed.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleBanUser = async (banStatus: boolean) => {
     if (!userData) return;
     try {
       await setDoc(doc(db, 'users', userData.id), { isBanned: banStatus }, { merge: true });
       setUserData({...userData, isBanned: banStatus});
       setUserMessage(`Success: User ${banStatus ? 'banned' : 'unbanned'} successfully.`);
     } catch(e) {
       setUserMessage("Error: Failed to change ban status.");
     }
  };

  const handleUpdateBalance = async () => {
     if (!userData) return;
     const parsedBalance = parseFloat(newBalance);
     if (isNaN(parsedBalance)) {
        setUserMessage("Error: Invalid balance amount.");
        return;
     }

     try {
       await setDoc(doc(db, 'wallets', userData.id), { totalBalance: parsedBalance }, { merge: true });
       setWalletData({...walletData, totalBalance: parsedBalance});
       setNewBalance('');
       
       // Log correction
       const correctionTxId = `correction-${Date.now()}`;
       await setDoc(doc(db, 'wallets', userData.id, 'transactions', correctionTxId), {
           type: 'correction',
           amount: parsedBalance, 
           status: 'completed',
           title: `Admin Balance Correction`,
           createdAt: new Date().toISOString(),
           txId: correctionTxId,
           isRead: false
       });
       
       setUserTransactions([{
           type: 'correction',
           amount: parsedBalance, 
           status: 'completed',
           title: `Admin Balance Correction`,
           createdAt: new Date().toISOString(),
           txId: correctionTxId,
           isRead: false
       }, ...userTransactions]);

       setUserMessage("Success: Balance corrected.");
     } catch(e) {
       setUserMessage("Error: Failed to update balance.");
     }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold text-black dark:text-white mb-6 shrink-0">Admin Dashboard</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 shrink-0 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
         <button 
           onClick={() => setActiveTab('users')}
           className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'users' ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}`}
         >
            User Management
         </button>
         <button 
           onClick={() => setActiveTab('credit')}
           className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'credit' ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}`}
         >
            Force Credit
         </button>
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar pb-10">
      {activeTab === 'credit' ? (
        <div className="bg-white/40 dark:bg-[#111111]/80 border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
          <h3 className="font-bold text-black dark:text-white mb-4">Verify & Push Missing Deposit</h3>
          <p className="text-sm text-black/60 dark:text-white/60 mb-6 font-medium leading-relaxed">
            The system will verify the TX Hash on the blockchain before crediting. It will automatically convert the crypto amount to NGN using live rates.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">User UID</label>
              <input 
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
                placeholder="Paste user UID..."
                className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
              />
            </div>
            
            <div>
               <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Transaction Hash (TX ID)</label>
               <input 
                 value={txHash}
                 onChange={(e) => setTxHash(e.target.value)}
                 placeholder="Paste transaction hash..."
                 className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
               />
            </div>

            <div className="flex gap-4">
               <div className="flex-1">
                 <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Asset (e.g. SOL)</label>
                 <input 
                   value={cryptoAsset}
                   onChange={(e) => setCryptoAsset(e.target.value)}
                   placeholder="SOL, USDC, DOGE..."
                   className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] uppercase text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
                 />
               </div>
               <div className="flex-1">
                 <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Crypto Amount</label>
                 <input 
                   value={cryptoAmount}
                   onChange={(e) => setCryptoAmount(e.target.value)}
                   placeholder="0.1"
                   type="number"
                   className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
                 />
               </div>
            </div>

            <div className="flex items-center gap-2 mt-4 ml-1">
              <input 
                type="checkbox" 
                id="forceSkip" 
                checked={forceSkip} 
                onChange={(e) => setForceSkip(e.target.checked)}
                className="w-5 h-5 rounded border-black/20 dark:border-white/20 text-black dark:text-white"
              />
              <label htmlFor="forceSkip" className="text-[13px] font-bold text-black/80 dark:text-white/80 cursor-pointer select-none pl-1">
                Skip Blockchain Verification (Force Credit)
              </label>
            </div>

            <button 
              disabled={loading}
              onClick={handleManualCredit}
              className={`w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 px-4 rounded-2xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 mt-6 shadow-xl ${loading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <PlusCircle size={18} />
                  {forceSkip ? 'Force Push Credit' : 'Verify & Push'}
                </>
              )}
            </button>
            
            {message && (
              <div className={`mt-4 text-sm font-medium p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm shadow-inner tracking-wide ${message.includes("Error") ? "bg-red-500/10 border border-red-500/20 text-red-500" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"}`}>
                {message.includes("Error") ? <XCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                <span className="leading-snug">{message}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white/40 dark:bg-[#111111]/80 border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
            <h3 className="font-bold text-black dark:text-white mb-4">User Search</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">User UID</label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                  <input 
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                    placeholder="Search by UID..."
                    className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl pl-11 pr-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Or filter specific TX ID (Optional)</label>
                <input 
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  placeholder="Paste TX Hash..."
                  className="w-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-inner backdrop-blur-md"
                />
              </div>

              <button 
                onClick={handleSearchUser}
                disabled={userLoading}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:opacity-90 flex justify-center items-center gap-2 transition-all mt-2 shadow-xl"
              >
                {userLoading ? <Loader2 size={18} className="animate-spin" /> : 'Search Records'}
              </button>

              {userMessage && (
                 <div className={`text-sm font-medium p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm shadow-inner tracking-wide ${userMessage.includes("Error") ? "bg-red-500/10 border border-red-500/20 text-red-500" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"}`}>
                   {userMessage.includes("Error") ? <XCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                   <span className="leading-snug">{userMessage}</span>
                 </div>
              )}
            </div>
          </div>

          {userData && (
            <div className="bg-white/40 dark:bg-[#111111]/80 border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm backdrop-blur-xl space-y-6">
               <div className="flex items-start justify-between">
                  <div>
                     <h3 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                       {userData.firstName} {userData.lastName}
                       {userData.isBanned && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Banned</span>}
                     </h3>
                     <p className="text-sm text-black/60 dark:text-white/60">{userData.email}</p>
                     <p className="text-[11px] text-black/40 dark:text-white/40 font-mono mt-1">UID: {userData.id}</p>
                  </div>
                  <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-black/50 dark:text-white/50">
                     <UserIcon size={24} />
                  </div>
               </div>

               <div className="p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-1">Total Balance</p>
                    <h2 className="text-2xl font-black text-black dark:text-white">₦{(walletData?.totalBalance || 0).toLocaleString()}</h2>
                  </div>
                  <Wallet size={24} className="text-black/30 dark:text-white/30" />
               </div>

               {/* Admin Actions */}
               <div className="grid grid-cols-1 gap-4 pt-2">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-black/60 dark:text-white/60 block px-1">Correct Balance (NGN)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="New amount..."
                        className="flex-1 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all font-medium shadow-inner"
                      />
                      <button 
                        onClick={handleUpdateBalance}
                        disabled={!newBalance}
                        className="bg-black dark:bg-white text-white dark:text-black font-bold px-5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        Update
                      </button>
                    </div>
                 </div>

                 <button 
                    onClick={() => handleBanUser(!userData.isBanned)}
                    className={`w-full py-4 mt-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${userData.isBanned ? 'bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                 >
                    <Ban size={18} />
                    {userData.isBanned ? 'Lift Ban' : 'Ban User Account'}
                 </button>
               </div>
            </div>
          )}

          {userData && (
            <div className="bg-white/40 dark:bg-[#111111]/80 border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
               <h3 className="font-bold text-black dark:text-white mb-4">Transaction History ({userTransactions.length})</h3>
               <div className="space-y-3">
                 {userTransactions.map((tx, i) => (
                    <div key={i} className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-black dark:text-white">{tx.title}</p>
                            <p className="text-[11px] text-black/50 dark:text-white/50 font-mono mt-0.5">{tx.txId}</p>
                          </div>
                          <span className={`font-black text-sm ${tx.type === 'deposit' || tx.type === 'receive' || tx.type === 'correction' ? 'text-emerald-500' : 'text-black dark:text-white'}`}>
                            {tx.type === 'deposit' || tx.type === 'receive' || tx.type === 'correction' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-black/40 dark:text-white/40">{new Date(tx.createdAt).toLocaleString()}</span>
                          <span className="uppercase tracking-wider font-bold text-black/50 dark:text-white/50 text-[10px]">{tx.status}</span>
                       </div>
                    </div>
                 ))}
                 {userTransactions.length === 0 && (
                    <div className="text-center py-8 text-black/40 dark:text-white/40 text-sm font-medium">
                       No transactions found.
                    </div>
                 )}
               </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

