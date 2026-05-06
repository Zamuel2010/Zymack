import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Lock, Eye, EyeOff, Settings, AlertCircle, Wifi, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, collection, writeBatch, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CardScreenProps {
  user: User;
  balance?: number;
  userData?: any;
}

const ZymackCard = ({ user, showDetails, isBilling }: { user: User, showDetails: boolean, isBilling?: boolean }) => (
  <div className="relative w-full aspect-[1.586/1] rounded-[24px] overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] group transition-all duration-500 hover:scale-[1.02] border border-white/10 dark:border-white/5">
    {/* Deep Premium Background */}
    <div className="absolute inset-0 bg-[#111111] dark:bg-[#080808]"></div>
    
    {/* Subtle Metallic/Glossy Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#333333]/40 via-transparent to-[#ffffff]/10 mix-blend-overlay"></div>
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#000000]/60 to-[#000000] mix-blend-multiply opacity-80"></div>
    
    {/* Top Section */}
    <div className="relative z-10 flex justify-between items-start w-full">
      <div className="flex items-center gap-2">
        <img src="https://i.postimg.cc/9FNTMHcH/IMG-4049.png" alt="Zymack Logo" className="h-8 w-8 object-cover rounded-full shadow-lg border border-white/10" referrerPolicy="no-referrer" />
        <span className="text-white/80 font-bold tracking-widest text-sm uppercase">Zymack</span>
      </div>
      <div className="flex items-center">
        <Wifi size={24} className="transform rotate-90 text-white/40 drop-shadow-md" />
      </div>
    </div>

    {/* Chip */}
    <div className="relative z-10 mt-6 sm:mt-4">
       <div className="w-11 h-8 rounded-[6px] bg-gradient-to-br from-[#E2C37A] via-[#FCEABB] to-[#C89B3C] opacity-90 overflow-hidden relative shadow-sm border border-[#AA8022]/40">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20"></div>
          <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/20"></div>
          <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/20"></div>
          <div className="absolute left-[20%] right-[20%] top-1/4 bottom-1/4 border border-black/10 rounded-sm"></div>
       </div>
    </div>

    {/* Bottom Section */}
    <div className="relative z-10 mt-auto w-full">
      {/* Card Number */}
      <div className="text-2xl sm:text-[26px] font-mono tracking-[0.12em] mb-4 sm:mb-5 font-bold text-white drop-shadow-md">
        {isBilling ? "******" : (showDetails ? "5412  7512  3412  8890" : "••••  ••••  ••••  8890")}
      </div>
      
      <div className="flex justify-between items-end w-full">
        <div className="flex flex-col flex-1">
          <span className="text-white/50 text-[9px] uppercase tracking-widest mb-1 font-bold">Card Holder</span>
          <span className="text-white font-medium text-xs sm:text-sm tracking-widest uppercase font-mono shadow-black drop-shadow-md line-clamp-1">
            {user?.displayName || 'ZYMACK PREMIUM'}
          </span>
        </div>
        
        <div className="flex items-center gap-6 sm:gap-8 mr-4 sm:mr-6">
          <div className="flex flex-col text-left">
            <span className="text-white/50 text-[9px] uppercase tracking-widest mb-1 font-bold">Valid Thru</span>
            <span className="text-white font-medium text-sm sm:text-base tracking-widest font-mono drop-shadow-md">
              {isBilling ? "**/**" : "12/28"}
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-white/50 text-[9px] uppercase tracking-widest mb-1 font-bold">CVV</span>
            <span className="text-white font-medium text-sm sm:text-base tracking-widest font-mono drop-shadow-md">
              {isBilling ? "***" : (showDetails ? "123" : "•••")}
            </span>
          </div>
        </div>
        
        {/* Real Mastercard Logo */}
        <div className="flex items-center justify-end shrink-0">
           <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-8 sm:h-10 object-contain drop-shadow-md" alt="Mastercard" />
        </div>
      </div>
    </div>
  </div>
);

export default function CardScreen({ user, balance = 0, userData }: CardScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [hasCard, setHasCard] = useState(userData?.hasVirtualCard || false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateCard = async () => {
    setErrorMsg("");
    if (balance < 1500) {
      setErrorMsg("Insufficient balance. Please deposit funds first.");
      return;
    }

    setIsPurchasing(true);
    
    try {
      // Create a transaction record and update balance
      const newTxRef = doc(collection(db, 'wallets', user.uid, 'transactions'));
      
      const batch = writeBatch(db);
      
      // Update balance
      batch.update(doc(db, 'wallets', user.uid), {
        totalBalance: increment(-1500)
      });
      
      // Add transaction
      batch.set(newTxRef, {
        amount: 1500,
        type: 'debit',
        description: 'Virtual Card Creation Fee',
        category: 'Fee',
        status: 'completed',
        createdAt: new Date().toISOString()
      });
      
      // Add card data
      batch.set(doc(db, 'users', user.uid), {
        hasVirtualCard: true,
        virtualCardNumber: '5412751234128890', // specific mocked number for now
      }, { merge: true });
      
      await batch.commit();

      setHasCard(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to create card. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!hasCard) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col pb-6 w-full"
      >
        <div className="mb-6 mt-4 text-center">
          <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Create Virtual Card</h2>
          <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-2 px-4 leading-relaxed">
            Get instant access to a premium Zymack Virtual USD/NGN card for global online payments.
          </p>
        </div>

        <div className="px-2 mb-8">
           <ZymackCard user={user} showDetails={false} isBilling={true} />
        </div>

        <div className="space-y-4 mb-8 px-2">
            <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                   <Zap size={20} />
                </div>
                <div>
                   <h4 className="font-bold text-sm text-black dark:text-white">Instant Issuance</h4>
                   <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">Use it immediately for online purchases.</p>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                   <CheckCircle2 size={20} />
                </div>
                <div>
                   <h4 className="font-bold text-sm text-black dark:text-white">Global Acceptance</h4>
                   <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">Accepted anywhere Mastercard is supported.</p>
                </div>
            </div>
        </div>

        {errorMsg && (
          <div className="px-2 mb-4">
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl">
               <AlertCircle size={18} />
               <span className="text-sm font-bold">{errorMsg}</span>
            </div>
          </div>
        )}

        <div className="px-2 mt-auto">
            <div className="flex justify-between items-center mb-6 px-2">
                <span className="font-bold text-black/60 dark:text-white/60">Card Creation Fee</span>
                <span className="font-black text-xl text-black dark:text-white">₦1,500</span>
            </div>

            <button 
               onClick={handleCreateCard}
               disabled={isPurchasing}
               className="w-full h-14 bg-gradient-to-r from-gray-900 via-black to-gray-900 dark:from-gray-100 dark:via-white dark:to-gray-100 text-white dark:text-black font-black text-sm rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center uppercase tracking-wider relative overflow-hidden shadow-xl disabled:opacity-50"
            >
               {/* Shine effect */}
               <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-black/10 skew-x-[-20deg]" />

               {isPurchasing ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                    <Settings className="text-white dark:text-black opacity-80" size={24} />
                 </motion.div>
               ) : (
                 <span className="relative z-10">Pay ₦1,500 & Create Card</span>
               )}
            </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col pb-6 w-full"
    >
      <div className="mb-6 mt-4">
        <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Your Cards</h2>
        <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-1">Manage your virtual and physical cards.</p>
      </div>

      {/* MVP Notice */}
      <div className="mb-8 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">MVP Preview Mode</h4>
          <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            This is a prototype layout of the Zymack Virtual Card. The real Mastercard integration and card issuance will be available in the next major update!
          </p>
        </div>
      </div>

      {/* The Mastercard MVP */}
      <ZymackCard user={user} showDetails={showDetails} />

      {/* Card Actions */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex flex-col items-center justify-center p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-3xl transition-colors gap-3 border border-black/5 dark:border-white/5"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#222] shadow-sm flex items-center justify-center text-black/80 dark:text-white/80">
            {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
            {showDetails ? 'Hide Details' : 'Show Details'}
          </span>
        </button>
        
        <button 
          className="flex flex-col items-center justify-center p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-3xl transition-colors gap-3 border border-black/5 dark:border-white/5"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#222] shadow-sm flex items-center justify-center text-black/80 dark:text-white/80">
            <Lock size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
            Freeze Card
          </span>
        </button>
        
        <button 
          className="flex flex-col items-center justify-center p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-3xl transition-colors gap-3 border border-black/5 dark:border-white/5"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#222] shadow-sm flex items-center justify-center text-black/80 dark:text-white/80">
            <Settings size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
            Settings
          </span>
        </button>
      </div>
    </motion.div>
  );
}
