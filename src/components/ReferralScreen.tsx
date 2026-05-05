import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Copy, Check, Users, Gift, Trophy, Medal, ArrowRight, Loader2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

interface ReferralScreenProps {
  onBack: () => void;
  uid: string;
}

export default function ReferralScreen({ onBack, uid }: ReferralScreenProps) {
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState('');
  
  const referralCode = uid.substring(0, 8).toUpperCase();

  useEffect(() => {
     const fetchRefs = async () => {
         try {
             const userDoc = await getDoc(doc(db, 'users', uid));
             if (userDoc.exists()) {
                 setReferralCount(userDoc.data().referralCount || 0);
             }
             
             const walletDoc = await getDoc(doc(db, 'wallets', uid));
             if (walletDoc.exists()) {
                 setReferralBalance(walletDoc.data().referralBalance || 0);
             }
         } catch(e) {
             console.error(e);
         }

         try {
             const topQuery = query(collection(db, 'users'), orderBy('referralCount', 'desc'), limit(10));
             const topSnap = await getDocs(topQuery);
             const leaders = topSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setTopReferrers(leaders);
         } catch (e) {
             console.error(e);
         }
     };
     fetchRefs();
  }, [uid]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
     if (referralBalance < 3000) {
         setMessage("Minimum withdrawal is ₦3,000");
         setTimeout(() => setMessage(''), 3000);
         return;
     }

     setWithdrawing(true);
     setMessage('');
     try {
         const token = await auth.currentUser?.getIdToken();
         const res = await fetch('/api/referral/withdraw', {
             method: 'POST',
             headers: {
                 'Authorization': `Bearer ${token}`
             }
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error);
         
         setMessage("Successfully withdrawn to main balance!");
         setReferralBalance(0);
     } catch (err: any) {
         setMessage(err.message || 'Failed to withdraw');
     } finally {
         setWithdrawing(false);
         setTimeout(() => setMessage(''), 3000);
     }
  };

  return (
    <div className="w-full h-full bg-[#f6f6f7] dark:bg-[#0a0a0a] flex flex-col transition-colors duration-500 relative">
      <div className="pt-12 pb-4 px-6 flex items-center border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-xl shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-4"
        >
          <ChevronLeft size={20} className="text-black dark:text-white" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <Gift size={18} /> Invitations & Rewards
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">Invite friends and earn bonuses</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-6 pb-20">

          {/* Action Buttons */}
          <div className="flex gap-4">
             <button 
               onClick={() => setShowLeaderboard(true)}
               className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-center gap-2 transition-colors font-bold"
             >
               <Trophy size={18} /> View Leaderboard
             </button>
          </div>

          {/* Code Section */}
          <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-black dark:text-white">Your Referral Code</h3>
            <p className="text-sm text-black/60 dark:text-white/60 mb-6">
              Share this code with your friends. When they sign up and verify, you both earn a bonus!
            </p>
            
            <button 
              onClick={copyCode}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <span className="font-mono font-black text-xl tracking-widest text-black dark:text-white">{referralCode}</span>
              {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-black/40 dark:text-white/40" />}
            </button>
          </div>

          {/* Stats Section */}
          <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
             <h3 className="font-bold text-black dark:text-white mb-4">Referral Dashboard</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center">
                  <Users size={20} className="text-black/40 dark:text-white/40 mb-2" />
                  <span className="text-2xl font-black text-black dark:text-white">{referralCount}</span>
                  <span className="text-[10px] uppercase font-bold text-black/50 dark:text-white/50 tracking-wider">Friends Joined</span>
                </div>
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center">
                  <Gift size={20} className="text-black/40 dark:text-white/40 mb-2" />
                  <span className="text-2xl font-black text-emerald-500">₦{referralBalance}</span>
                  <span className="text-[10px] uppercase font-bold text-black/50 dark:text-white/50 tracking-wider">Total Bonus</span>
                </div>
             </div>

             <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-black dark:text-white">Withdraw Bonus</h4>
                    <p className="text-[10px] text-black/50 dark:text-white/50">Minimum ₦3,000 to withdraw</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-500 flex items-center gap-1">
                     ₦{referralBalance} / ₦3000
                  </span>
                </div>

                {message && (
                  <p className={`text-xs font-bold mb-3 text-center ${message.includes('Success') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}

                <button 
                  onClick={handleWithdraw}
                  disabled={referralBalance < 3000 || withdrawing}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors ${
                    referralBalance >= 3000 
                      ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90' 
                      : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed'
                  }`}
                >
                  {withdrawing ? <Loader2 size={18} className="animate-spin" /> : 'Withdraw to Balance'}
                </button>
             </div>
          </div>
          
        </div>
      </div>

      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-[#f6f6f7] dark:bg-[#0a0a0a] z-50 flex flex-col"
          >
            <div className="pt-12 pb-4 px-6 flex items-center border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-xl shrink-0">
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors mr-4"
              >
                <ChevronLeft size={20} className="text-black dark:text-white" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" /> Leaderboard
                </h2>
                <p className="text-xs text-black/60 dark:text-white/60">Top referrers on Zymack</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-20">
              <div className="space-y-4">
                  {topReferrers.length === 0 ? (
                     <div className="text-center py-10">
                        <Trophy size={48} className="mx-auto mb-4 text-black/10 dark:text-white/10" />
                        <p className="text-sm font-medium text-black/40 dark:text-white/40">No referrers yet. Be the first!</p>
                     </div>
                  ) : (
                     topReferrers.map((user, index) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={user.id} 
                          className="flex items-center justify-between p-4 bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                 index === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                 index === 1 ? 'bg-slate-300 text-black shadow-lg' :
                                 index === 2 ? 'bg-amber-700 text-white shadow-lg' :
                                 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60'
                              }`}>
                                 {index < 3 ? <Medal size={16} /> : `#${index + 1}`}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-black/90 dark:text-white/90">
                                    {user.displayName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Anonymous')}
                                    {user.id === uid && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full inline-flex font-bold uppercase tracking-wider align-middle">You</span>}
                                 </h4>
                                 <p className="text-[10px] uppercase font-bold text-black/40 dark:text-white/40 tracking-wider mt-0.5">
                                    @{user.id.substring(0,6)}...
                                 </p>
                              </div>
                           </div>
                           <div className="text-right flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                 <span className="block text-lg font-black text-black dark:text-white leading-none">
                                    {user.referralCount || 0}
                                 </span>
                                 <span className="block text-[9px] uppercase font-bold text-black/40 dark:text-white/40 mt-1">Total</span>
                              </div>
                              <div className="w-px h-6 bg-black/10 dark:bg-white/10" />
                              <div className="flex flex-col items-center">
                                 <span className="block text-lg font-black text-emerald-500 leading-none">
                                    {user.referralCount || 0}
                                 </span>
                                 <span className="block text-[9px] uppercase font-bold text-emerald-500/70 mt-1">Active</span>
                              </div>
                           </div>
                        </motion.div>
                     ))
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
