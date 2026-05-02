import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Lock, Eye, EyeOff, Settings, AlertCircle, Wifi } from 'lucide-react';
import { User } from 'firebase/auth';

interface CardScreenProps {
  user: User;
}

export default function CardScreen({ user }: CardScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

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
      <div className="relative w-full aspect-[1.586/1] rounded-[24px] overflow-hidden p-6 sm:p-8 text-white shadow-2xl flex flex-col justify-between group transition-transform duration-500 hover:scale-[1.02]">
        {/* Background & Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-black dark:from-[#0a0a0a] dark:to-[#050505]"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:16px_16px]"></div>
        
        {/* Abstract Glows */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/30 rounded-full blur-[60px] pointer-events-none mix-blend-screen transition-opacity duration-500 group-hover:opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/30 rounded-full blur-[60px] pointer-events-none mix-blend-screen transition-opacity duration-500 group-hover:opacity-50"></div>
        
        {/* Top Section */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-white/90 font-black tracking-[0.2em] text-lg">ZYMACK</span>
            <span className="text-white/60 text-[10px] tracking-widest uppercase mt-0.5 font-bold">Virtual</span>
          </div>
          <div className="flex items-center gap-3">
            <Wifi size={28} className="transform rotate-90 text-white/50" />
          </div>
        </div>

        {/* Chip */}
        <div className="relative z-10 mt-6 sm:mt-8">
           <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90 overflow-hidden relative border border-yellow-300/50">
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20"></div>
              <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/20"></div>
              <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/20"></div>
           </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 mt-auto">
          <div className="text-2xl sm:text-3xl font-mono tracking-[0.15em] mb-4 sm:mb-6 font-medium text-white/90 drop-shadow-md">
            {showDetails ? "5412 7512 3412 8890" : "•••• •••• •••• 8890"}
          </div>
          
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider mb-1 font-bold">Card Holder</span>
              <span className="text-white/90 font-medium text-sm tracking-widest uppercase font-mono shadow-black drop-shadow-md">
                {user?.displayName || 'Zymack Premium'}
              </span>
            </div>
            
            <div className="flex flex-col mr-4 sm:mr-8 text-center">
              <span className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider mb-1 font-bold">Expires</span>
              <span className="text-white/90 font-medium text-sm tracking-widest font-mono drop-shadow-md">12/28</span>
            </div>

            <div className="flex flex-col mr-2 sm:mr-4 text-center">
              <span className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider mb-1 font-bold">CVV</span>
              <span className="text-white/90 font-medium text-sm tracking-widest font-mono drop-shadow-md">
                {showDetails ? "123" : "•••"}
              </span>
            </div>
            
            {/* Mastercard Mock Logo */}
            <div className="flex items-center -mr-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 mix-blend-screen opacity-90 relative z-10"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500 mix-blend-screen opacity-90 -ml-4 sm:-ml-5 relative z-20"></div>
            </div>
          </div>
        </div>
      </div>

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
