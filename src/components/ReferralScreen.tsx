import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Share2, Copy, Check, Users, Gift } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ReferralScreenProps {
  onBack: () => void;
  uid: string;
}

export default function ReferralScreen({ onBack, uid }: ReferralScreenProps) {
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const referralCode = uid.substring(0, 8).toUpperCase();
  const bonusEarned = referralCount * 500; // e.g., 500 NGN per referral

  useEffect(() => {
     // Optional: If we track referrals, we would fetch them here.
     // For now, we mock 0 or query a specific field if it exists.
     const fetchRefs = async () => {
         const refs = query(collection(db, 'users'), where('referredBy', '==', uid));
         const snap = await getDocs(refs);
         setReferralCount(snap.size);
     };
     fetchRefs();
  }, [uid]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <Gift size={18} /> Invitations & Rewards
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">Invite friends and earn bonuses</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-6">

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
                  <span className="text-2xl font-black text-emerald-500">₦{bonusEarned}</span>
                  <span className="text-[10px] uppercase font-bold text-black/50 dark:text-white/50 tracking-wider">Total Bonus</span>
                </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
