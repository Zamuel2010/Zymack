import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Wallet, Building2, AlertCircle, Users, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';

interface WithdrawScreenProps {
  user: User;
  balance: number;
  onBack: () => void;
}

export default function WithdrawScreen({ user, balance, onBack }: WithdrawScreenProps) {
  const [method, setMethod] = useState<'zymack' | 'bank' | null>(null);

  // Zymack Transfer State
  const [recipientUid, setRecipientUid] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Bank Withdrawal State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);

  useEffect(() => {
    if (method === 'bank') {
       fetchBankAccounts();
    }
  }, [method, user.uid]);

  const fetchBankAccounts = async () => {
     setBanksLoading(true);
     try {
       const q = query(collection(db, 'wallets', user.uid, 'bankAccounts'));
       const snap = await getDocs(q);
       const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setBankAccounts(accounts);
       if (accounts.length > 0) {
           setSelectedAccountId(accounts[0].id);
       }
     } catch(e) {
       console.error("Failed to load banks", e);
     }
     setBanksLoading(false);
  };

  const handleZymackTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUid || !amount) {
      setError("Please fill all fields.");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (transferAmount > balance) {
      setError("Insufficient balance.");
      return;
    }

    if (recipientUid === user.uid) {
      setError("You cannot transfer to yourself.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/user/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              senderUid: user.uid,
              recipientUid: recipientUid,
              amount: transferAmount
          })
      });

      const data = await resp.json();
      if (!resp.ok) {
          throw new Error(data.error || "Failed to transfer funds");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transfer funds. Verify recipient UID.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount) {
      setError("Please fill all fields.");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (transferAmount > balance) {
      setError("Insufficient balance.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);
      if (!selectedAccount) throw new Error("Invalid bank account.");

      const resp = await fetch("/api/user/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              uid: user.uid,
              accountId: selectedAccountId,
              amount: transferAmount
          })
      });

      const data = await resp.json();
      if (!resp.ok) {
          throw new Error(data.error || "Failed to process withdrawal");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#f8f9fc] to-[#eef1f6] dark:from-[#050505] dark:to-[#0a0a0a] z-50 overflow-y-auto transition-colors duration-500">
      <div className="p-6 pt-12 relative min-h-full">
         <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <button onClick={onBack} className="w-10 h-10 bg-white/60 dark:bg-white/10 backdrop-blur-lg border border-white/60 dark:border-white/10 shadow-sm rounded-full flex items-center justify-center text-black dark:text-white mb-6 hover:scale-105 active:scale-95 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Withdraw Funds</h2>
        <p className="text-sm text-black/60 dark:text-white/60 mb-8">Available balance: <span className="font-bold text-black dark:text-white">₦{(balance || 0).toLocaleString()}</span></p>
        
        {!method ? (
          <div className="space-y-4">
             <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-6">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                  <strong>Instant & Free:</strong> Zymack gives you the power to hold fiat backed by crypto. You can send free, instant P2P transfers to any other Zymack user smoothly.
                </p>
             </div>

            <button onClick={() => setMethod('zymack')} className="w-full bg-white/70 dark:bg-[#111]/70 p-6 rounded-[32px] border-2 border-white dark:border-white/10 flex items-center gap-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="w-14 h-14 bg-white dark:bg-black/40 shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-black dark:text-white mb-0.5">Transfer to Zymack User</h3>
                <p className="text-sm font-medium text-black/50 dark:text-white/50">Send instantly to another user</p>
              </div>
            </button>
            <button onClick={() => setMethod('bank')} className="w-full bg-white/70 dark:bg-[#111]/70 p-6 rounded-[32px] border-2 border-white dark:border-white/10 flex items-center gap-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="w-14 h-14 bg-white dark:bg-black/40 shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-blue-500 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-black dark:text-white mb-0.5">Transfer to local bank</h3>
                <p className="text-sm font-medium text-black/50 dark:text-white/50">Withdraw to Nigerian Bank</p>
              </div>
            </button>
          </div>
        ) : method === 'zymack' ? (
          <div className="bg-white/80 dark:bg-[#111]/80 p-8 rounded-[32px] border-2 border-white dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="text-xl font-bold text-black dark:text-white mb-6 relative z-10">P2P Transfer</h3>
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-8 relative z-10">
                 <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4 backdrop-blur-md">
                   <CheckCircle size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Transfer Sent!</h2>
                 <p className="text-black/60 dark:text-white/60 text-center text-sm mb-8">
                   You have successfully sent ₦{parseFloat(amount).toLocaleString()} to the user!
                 </p>
                 <button onClick={() => { setSuccess(false); setMethod(null); }} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold transition-opacity hover:opacity-90 shadow-xl">
                   Done
                 </button>
              </div>
            ) : (
              <form onSubmit={handleZymackTransfer} className="space-y-4">
                <div className="relative z-10">
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Recipient Zymack UID</label>
                  <input 
                    value={recipientUid}
                    onChange={(e) => setRecipientUid(e.target.value)}
                    placeholder="Enter recipient's UID..."
                    className="w-full bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 shadow-sm"
                  />
                </div>
                <div className="relative z-10">
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Amount (NGN)</label>
                  <div className="relative w-full">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 font-bold">₦</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl pl-10 pr-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 font-medium shadow-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl flex items-start gap-2 relative z-10 backdrop-blur-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-6 flex gap-3 relative z-10">
                  <button type="button" onClick={() => setMethod(null)} disabled={loading} className="flex-1 py-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl font-bold text-black dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-2xl font-bold hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Transfer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-[#111]/80 p-8 rounded-[32px] border-2 border-white dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
            <h3 className="text-xl font-bold text-black dark:text-white mb-6 relative z-10">Bank Withdrawal</h3>
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-8 relative z-10">
                 <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-4 backdrop-blur-md">
                   <CheckCircle size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Withdrawal Initiated!</h2>
                 <p className="text-black/60 dark:text-white/60 text-center text-sm mb-8">
                   You have successfully requested a withdrawal of ₦{parseFloat(amount).toLocaleString()} to your bank account.
                 </p>
                 <button onClick={onBack} className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group">
                    <span className="relative z-10">Return Home</span>
                 </button>
              </div>
            ) : (
              <form onSubmit={handleBankWithdrawal} className="space-y-4">
                <div className="relative z-10">
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Select Bank Account</label>
                  {banksLoading ? (
                    <div className="w-full bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl px-5 py-4 flex items-center justify-center">
                       <Loader2 size={20} className="animate-spin text-blue-500" />
                    </div>
                  ) : bankAccounts.length === 0 ? (
                    <div className="w-full bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl px-5 py-4 text-black/50 dark:text-white/50 text-center text-sm">
                       No bank accounts found. Please add one in settings.
                    </div>
                  ) : (
                     <div className="relative">
                       <select
                         value={selectedAccountId}
                         onChange={(e) => setSelectedAccountId(e.target.value)}
                         className="w-full appearance-none bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium shadow-sm"
                       >
                          {bankAccounts.map(a => (
                              <option key={a.id} value={a.id}>{a.bankName} - {a.accountNumber}</option>
                          ))}
                       </select>
                       <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
                     </div>
                  )}
                </div>
                <div className="relative z-10">
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2 px-1">Amount (NGN)</label>
                  <div className="relative w-full">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 font-bold">₦</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-white dark:bg-black/40 border-2 border-white/80 dark:border-white/10 rounded-2xl pl-10 pr-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium shadow-sm"
                    />
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl flex items-start gap-2 relative z-10 backdrop-blur-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="pt-6 flex gap-3 relative z-10">
                  <button type="button" onClick={() => setMethod(null)} disabled={loading} className="flex-1 py-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl font-bold text-black dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || bankAccounts.length === 0} className="flex-[2] py-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-2xl font-bold hover:shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Withdraw Funds'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

