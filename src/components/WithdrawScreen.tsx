import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Wallet, Building2, AlertCircle, Users, CheckCircle, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, runTransaction, collection } from 'firebase/firestore';

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
      await runTransaction(db, async (transaction) => {
        const senderWalletRef = doc(db, 'wallets', user.uid);
        const recipientWalletRef = doc(db, 'wallets', recipientUid);

        const senderDoc = await transaction.get(senderWalletRef);
        const recipientDoc = await transaction.get(recipientWalletRef);

        if (!senderDoc.exists() || (senderDoc.data().totalBalance || 0) < transferAmount) {
          throw new Error("Insufficient balance!");
        }

        if (!recipientDoc.exists()) {
          throw new Error("Recipient does not exist!");
        }

        const newSenderBalance = (senderDoc.data().totalBalance || 0) - transferAmount;
        const newRecipientBalance = (recipientDoc.data().totalBalance || 0) + transferAmount;

        // Update balances
        transaction.update(senderWalletRef, { totalBalance: newSenderBalance });
        transaction.update(recipientWalletRef, { totalBalance: newRecipientBalance });

        // Add transaction log for Sender
        const txId = `trf-${Date.now()}`;
        const senderTxRef = doc(collection(db, 'wallets', user.uid, 'transactions'), txId);
        transaction.set(senderTxRef, {
          type: 'withdrawal',
          amount: transferAmount,
          title: `Transfer to ${recipientUid.substring(0, 5)}...`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          isRead: false
        });

        // Add transaction log for Recipient
        const recipientTxRef = doc(collection(db, 'wallets', recipientUid, 'transactions'), txId);
        transaction.set(recipientTxRef, {
          type: 'deposit',
          amount: transferAmount,
          title: `Transfer from ${user.uid.substring(0, 5)}...`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          isRead: false
        });
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transfer funds. Verify recipient UID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8f9fc] dark:bg-[#050505] z-50 overflow-y-auto transition-colors duration-500">
      <div className="p-6 pt-12">
        <button onClick={onBack} className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-black dark:text-white mb-6 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
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

            <button onClick={() => setMethod('zymack')} className="w-full bg-white/40 dark:bg-white/[0.02] p-6 rounded-[32px] border border-white/60 dark:border-white/10 flex items-center gap-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="w-14 h-14 bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/10 shadow-inner text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md relative z-10">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-black dark:text-white mb-0.5">Transfer to Zymack User</h3>
                <p className="text-sm font-medium text-black/50 dark:text-white/50">Send instantly to another user</p>
              </div>
            </button>
            <button onClick={() => setMethod('bank')} className="w-full bg-white/40 dark:bg-white/[0.02] p-6 rounded-[32px] border border-white/60 dark:border-white/10 flex items-center gap-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="w-14 h-14 bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/10 shadow-inner text-blue-500 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md relative z-10">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-black dark:text-white mb-0.5">Transfer to local bank</h3>
                <p className="text-sm font-medium text-black/50 dark:text-white/50">Withdraw to Nigerian Bank Account</p>
              </div>
            </button>
          </div>
        ) : method === 'zymack' ? (
          <div className="bg-white/40 dark:bg-white/[0.02] p-8 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] pointer-events-none" />
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
                    className="w-full bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-2xl px-5 py-4 text-[16px] text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 backdrop-blur-md shadow-inner"
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
                      className="w-full bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-2xl pl-10 pr-5 py-4 text-lg text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-all placeholder:text-black/30 dark:placeholder:text-white/30 font-medium backdrop-blur-md shadow-inner"
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
                  <button type="button" onClick={() => setMethod(null)} disabled={loading} className="flex-1 py-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl font-bold text-black dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 shadow-xl">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Transfer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">
              Coming Soon: Bank Transfers
            </h3>
            <p className="text-black/60 dark:text-white/60 mb-6 text-sm leading-relaxed">
              Your balance of <strong>₦{(balance || 0).toLocaleString()}</strong> is real and secure. In the final version, this flow will allow you to withdraw the funds back to your bank using the live API. 
            </p>
            <button onClick={() => setMethod(null)} className="w-full py-4 bg-black/5 dark:bg-white/5 rounded-xl font-bold text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

