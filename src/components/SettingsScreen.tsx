import React, { useState } from 'react';
import { ChevronLeft, Lock, KeyRound, ShieldAlert, Loader2, CheckCircle } from 'lucide-react';
import { User, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface SettingsScreenProps {
  user: User;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function SettingsScreen({ user, onBack, isDarkMode }: SettingsScreenProps) {
  const [loadingPin, setLoadingPin] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleResetPin = async () => {
    setLoadingPin(true);
    setMessage({ text: '', type: '' });
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        pin: null
      });
      setMessage({ text: 'PIN has been reset. You will be asked to set up a new PIN next time you log in.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to reset PIN', type: 'error' });
    } finally {
      setLoadingPin(false);
    }
  };

  const handleChangePassword = async () => {
    setLoadingPass(true);
    setMessage({ text: '', type: '' });
    try {
      if (user.email) {
        await sendPasswordResetEmail(auth, user.email);
        setMessage({ text: 'Password reset link sent to your email address.', type: 'success' });
      } else {
        setMessage({ text: 'No email found for this account.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to send password reset', type: 'error' });
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAFA] text-black'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 shrink-0 border-b border-black/5 dark:border-white/5">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
        </button>
        <h2 className="text-lg font-black tracking-tight">Security & Privacy</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
          {message.text && (
             <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {message.type === 'success' && <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                <span className="leading-snug">{message.text}</span>
             </div>
          )}

          <div className="space-y-4">
             <div className="bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-[24px] p-2 shadow-sm">
                
                {/* Reset PIN */}
                <div className="p-4 flex flex-col gap-3">
                   <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                         <KeyRound size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-base text-black dark:text-white">Reset Transaction PIN</h3>
                         <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed max-w-[250px] mt-1">
                            Forgot your PIN? Reset it here and you will be prompted to create a new one.
                         </p>
                      </div>
                   </div>
                   <button 
                      onClick={handleResetPin}
                      disabled={loadingPin}
                      className="mt-2 text-sm font-bold bg-black/5 dark:bg-white/5 text-black dark:text-white py-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full flex justify-center items-center h-12"
                   >
                      {loadingPin ? <Loader2 size={18} className="animate-spin" /> : "Reset PIN"}
                   </button>
                </div>

                <div className="h-px w-full bg-black/5 dark:bg-white/5 my-1" />

                {/* Change Password */}
                <div className="p-4 flex flex-col gap-3">
                   <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                         <Lock size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-base text-black dark:text-white">Change Password</h3>
                         <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed max-w-[250px] mt-1">
                            We will send a secure link to your registered email address to change your password.
                         </p>
                      </div>
                   </div>
                   <button 
                      onClick={handleChangePassword}
                      disabled={loadingPass}
                      className="mt-2 text-sm font-bold bg-black/5 dark:bg-white/5 text-black dark:text-white py-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full flex justify-center items-center h-12"
                   >
                      {loadingPass ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Email"}
                   </button>
                </div>
                
                <div className="h-px w-full bg-black/5 dark:bg-white/5 my-1" />

                {/* Privacy Warning */}
                <div className="p-4 flex flex-col gap-3">
                   <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                         <ShieldAlert size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-base text-black dark:text-white">Privacy Data</h3>
                         <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed mt-1">
                            Your Zymack account data is securely encrypted. We don't share your financial activity with third parties.
                         </p>
                      </div>
                   </div>
                </div>

             </div>
          </div>
      </div>
    </div>
  );
}
