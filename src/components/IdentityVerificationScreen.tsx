import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShieldCheck, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function IdentityVerificationScreen({ user, onBack, userData }: { user: any, onBack: () => void, userData: any }) {
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentTier = userData?.kycLevel || 1;

  const handleSubmit = async () => {
    if (!bvn && !nin) return;
    setLoading(true);
    setStatus(null);
    
    // Simulate verification delay
    setTimeout(async () => {
       try {
           await setDoc(doc(db, 'users', user.uid), {
              kycLevel: 2,
              kycStatus: 'verified',
              bvn: bvn || null,
              nin: nin || null,
           }, { merge: true });
           setStatus('success');
       } catch (err) {
           setStatus('error');
       } finally {
           setLoading(false);
       }
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="absolute inset-0 bg-[#F5F5F7] dark:bg-[#050505] z-50 overflow-y-auto"
    >
      <div className="absolute top-0 w-full h-[30vh] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-b-[40px] pointer-events-none"></div>

      <div className="relative z-10 px-6 pt-10 pb-20 max-w-[480px] mx-auto min-h-screen flex flex-col">
          <div className="flex items-center mb-8">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
            </button>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Verification</h2>
          </div>

          <div className="bg-white dark:bg-[#111] rounded-[32px] p-6 shadow-sm border border-black/5 dark:border-white/5 mb-8">
             <div className="flex justify-between items-end mb-4">
                 <div>
                    <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-1">Current Status</p>
                    <h3 className="text-xl font-black text-black dark:text-white">Tier {currentTier}</h3>
                 </div>
                 {currentTier === 1 ? (
                   <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Unverified</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                   </div>
                 )}
             </div>

             <div className="space-y-4 relative">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-lg shadow-emerald-500/20">1</div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-black/90 dark:text-white/90">Tier 1: Basic Limit</p>
                        <p className="text-xs font-medium text-black/50 dark:text-white/50 mt-0.5">Limit: ₦50,000 / day</p>
                    </div>
                 </div>
                 {/* Connector line */}
                 <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-black/10 dark:bg-white/10 -ml-[1px]"></div>
                 
                 <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${currentTier >= 2 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40'}`}>2</div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-black/90 dark:text-white/90">Tier 2: Upgraded Limit</p>
                        <p className="text-xs font-medium text-black/50 dark:text-white/50 mt-0.5">Limit: ₦5,000,000 / day</p>
                    </div>
                 </div>
             </div>
          </div>

          {currentTier === 1 && (
              <div className="bg-white dark:bg-[#111] rounded-[32px] p-6 shadow-sm border border-black/5 dark:border-white/5 flex-1">
                 <div className="flex flex-col items-center justify-center mb-6 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                       <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-lg font-black text-black/90 dark:text-white/90 mb-2">Upgrade to Tier 2</h3>
                    <p className="text-sm font-medium text-black/50 dark:text-white/50 leading-relaxed">Provide your Bank Verification Number (BVN) or National Identity Number (NIN) to upgrade your account limits.</p>
                 </div>

                 <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Bank Verification Number (BVN)</label>
                        <input 
                            type="text"
                            placeholder="Enter 11-digit BVN"
                            value={bvn}
                            onChange={e => { setBvn(e.target.value.replace(/\D/g, '').slice(0, 11)); setNin(''); }}
                            className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 my-2">
                        <div className="h-px bg-black/5 dark:bg-white/5 flex-1"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30">OR</span>
                        <div className="h-px bg-black/5 dark:bg-white/5 flex-1"></div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">National Identity Number (NIN)</label>
                        <input 
                            type="text"
                            placeholder="Enter 11-digit NIN"
                            value={nin}
                            onChange={e => { setNin(e.target.value.replace(/\D/g, '').slice(0, 11)); setBvn(''); }}
                            className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
                        />
                    </div>
                 </div>

                 {status === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl mt-6">
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-bold">Verification successful! Your Tier 2 limits are now active.</span>
                    </div>
                 )}
                 {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl mt-6">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">Verification failed. Please try again or contact support.</span>
                    </div>
                 )}

                 <div className="mt-8">
                     <button
                        onClick={handleSubmit}
                        disabled={loading || (!bvn && !nin)}
                        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg ${
                            (bvn || nin)
                             ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]'
                             : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none'
                        }`}
                     >
                         {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verify Identity'}
                     </button>
                 </div>
              </div>
          )}
          {currentTier >= 2 && (
             <div className="flex flex-col items-center justify-center p-8 mt-10">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                   <ShieldCheck size={48} />
                </div>
                <h3 className="text-2xl font-black text-black dark:text-white mb-2 text-center tracking-tight">Identity Verified</h3>
                <p className="text-black/50 dark:text-white/50 text-center font-medium">You have unlocked Tier 2 limits. You can now transact freely on your account.</p>
             </div>
          )}
      </div>
    </motion.div>
  );
}
