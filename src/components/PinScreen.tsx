import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Lock, ShieldCheck, ChevronLeft, Delete } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

interface PinScreenProps {
  user: User;
  isDarkMode: boolean;
  onSuccess: () => void;
}

export default function PinScreen({ user, isDarkMode, onSuccess }: PinScreenProps) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'setup' | 'confirm' | 'verify'>('verify');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserPin = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().pin) {
          setStoredPin(snap.data().pin);
          setBiometricEnabled(snap.data().biometricEnabled || false);
          setMode('verify');
        } else {
          setMode('setup');
        }
      } catch (err) {
        console.error("Error fetching PIN data", err);
        setMode('setup'); // Fallback to setup
      } finally {
        setLoading(false);
      }
    };
    fetchUserPin();
  }, [user]);

  const handleKeyPress = (digit: string) => {
    setError('');
    const currentPin = mode === 'confirm' ? confirmPin : pin;
    
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      if (mode === 'confirm') setConfirmPin(newPin);
      else setPin(newPin);

      if (newPin.length === 4) {
        handlePinComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (mode === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handlePinComplete = async (completedPin: string) => {
    if (mode === 'setup') {
      setTimeout(() => setMode('confirm'), 300);
    } else if (mode === 'confirm') {
      if (completedPin === pin) {
        // Save to DB
        setLoading(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, { pin: completedPin, biometricEnabled }, { merge: true });
          onSuccess();
        } catch (err) {
          console.error(err);
          setError('Failed to save PIN.');
          setLoading(false);
          setMode('setup');
          setPin('');
          setConfirmPin('');
        }
      } else {
        setError('PINs do not match. Try again.');
        setTimeout(() => {
          setConfirmPin('');
        }, 500);
      }
    } else if (mode === 'verify') {
      if (completedPin === storedPin) {
        onSuccess();
      } else {
        setError('Incorrect PIN.');
        setTimeout(() => {
          setPin('');
        }, 500);
      }
    }
  };

  const currentDisplay = mode === 'confirm' ? confirmPin : pin;

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#f8f9fc] dark:bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#f8f9fc] dark:bg-[#050505] text-[#050505] dark:text-white flex justify-center font-sans overflow-hidden transition-colors duration-500">
      <div className="w-full max-w-[480px] bg-white dark:bg-[#0A0A0A] h-full relative shadow-2xl flex flex-col border-x border-black/5 dark:border-white/5 transition-colors duration-500 overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-black/5 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

        <div className="flex-1 px-6 pt-12 pb-8 flex flex-col justify-between relative z-10 w-full items-center">
          
          {/* Header */}
          <div className="w-full flex items-center justify-center relative mb-8">
            {mode === 'confirm' && (
              <button 
                onClick={() => { setMode('setup'); setConfirmPin(''); }}
                className="absolute left-0 p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black/60 dark:text-white/60">
              {mode === 'verify' ? <Lock size={20} /> : <ShieldCheck size={20} />}
            </div>
          </div>

          {/* Title & Dots */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-center text-black dark:text-white mb-2">
              {mode === 'setup' ? 'Create a PIN' : mode === 'confirm' ? 'Confirm your PIN' : 'Enter your PIN'}
            </h2>
            <p className="text-xs text-black/50 dark:text-white/50 text-center uppercase tracking-widest mb-10">
              {mode === 'setup' ? 'Secure your account' : mode === 'confirm' ? 'Enter the 4 digits again' : 'Welcome back'}
            </p>

            <div className="flex gap-4 mb-2">
              {[0, 1, 2, 3].map((index) => (
                <motion.div 
                  key={index}
                  initial={false}
                  animate={{ 
                    scale: currentDisplay.length > index ? 1.2 : 1,
                    backgroundColor: currentDisplay.length > index ? (isDarkMode ? '#ffffff' : '#050505') : 'transparent',
                    borderColor: currentDisplay.length > index ? (isDarkMode ? '#ffffff' : '#050505') : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                  }}
                  className="w-4 h-4 rounded-full border-2 transition-colors duration-300"
                />
              ))}
            </div>
            
            <div className="h-6 mt-4">
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs font-medium"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Setup Biometric Toggle */}
          {(mode === 'setup' || mode === 'confirm') && (
            <div className="w-full mb-4 px-2">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Fingerprint size={16} />
                  </div>
                  <span className="text-sm font-bold text-black/80 dark:text-white/80">Enable Biometric Login</span>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={biometricEnabled}
                    onChange={(e) => setBiometricEnabled(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${biometricEnabled ? 'bg-emerald-500' : 'bg-black/20 dark:bg-white/20'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${biometricEnabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
          )}

          {/* Keypad */}
          <div className="w-full max-w-[300px] mt-auto">
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit.toString())}
                  className="w-16 h-16 mx-auto rounded-full text-2xl font-medium flex items-center justify-center text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors"
                >
                  {digit}
                </button>
              ))}
              
              {/* Bottom Row */}
              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                {mode === 'verify' && biometricEnabled && currentDisplay.length === 0 && (
                  <button onClick={() => onSuccess()} className="text-emerald-600 dark:text-emerald-400 hover:opacity-70 transition-opacity">
                    <Fingerprint size={28} />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 mx-auto rounded-full text-2xl font-medium flex items-center justify-center text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors"
              >
                0
              </button>
              
              <button
                onClick={handleDelete}
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors"
              >
                <Delete size={24} />
              </button>
            </div>

            {mode === 'verify' && (
               <div className="text-center mt-8">
                 <button className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">
                   Forgot PIN?
                 </button>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
