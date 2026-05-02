/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, Sun, Moon, User as UserIcon, Tag } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from './lib/firebase';

import Dashboard from './components/Dashboard';
import PinScreen from './components/PinScreen';

export default function App() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsPinVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0 to 4
  };

  const strengthScore = calculateStrength(password);
  const strengthLabels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!email || !password || !firstName || !lastName) {
          throw new Error("Please fill in all required fields.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`.trim()
        });
      } else {
        if (!email || !password) {
          throw new Error("Please enter your email and password.");
        }
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      let errorMsg = err.message || 'Authentication failed. Please try again.';
      if (errorMsg.includes('auth/email-already-in-use')) {
        errorMsg = 'This email is already registered. Please log in.';
      } else if (errorMsg.includes('auth/weak-password')) {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (errorMsg.includes('auth/invalid-credential')) {
        errorMsg = 'Incorrect email or password.';
      } else if (errorMsg.includes('auth/invalid-email')) {
        errorMsg = 'Please enter a valid email address.';
      } else if (errorMsg.includes('auth/operation-not-allowed')) {
        errorMsg = 'Email/Password sign-in is not enabled. Please enable it in your Firebase Console > Authentication > Sign-in method.';
      } else if (errorMsg.includes('network-request-failed')) {
        errorMsg = 'Network connection failed. This could be due to a poor connection, or an ad-blocker (like Brave Shields) blocking Firebase.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      let errorMsg = err.message || 'Google Sign-In failed.';
      if (errorMsg.includes('auth/popup-closed-by-user')) {
        errorMsg = 'Popup closed. If you are using the app inside a preview, try opening it in a new tab to use Google Sign-In.';
      } else if (errorMsg.includes('auth/popup-blocked')) {
        errorMsg = 'Popup blocked by browser. Please allow popups for this site.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (err: any) {
      console.error("Apple Sign-In Error:", err);
      let errorMsg = err.message || 'Apple Sign-In failed.';
      if (errorMsg.includes('auth/popup-closed-by-user')) {
        errorMsg = 'Popup closed. If you are using the app inside a preview, try opening it in a new tab to use Apple Sign-In.';
      } else if (errorMsg.includes('auth/popup-blocked')) {
        errorMsg = 'Popup blocked by browser. Please allow popups for this site.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 8000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      let errorMsg = err.message || 'Failed to send password reset email.';
      if (errorMsg.includes('auth/user-not-found')) {
        errorMsg = 'No account found with this email address.';
      } else if (errorMsg.includes('network-request-failed')) {
        errorMsg = 'Network connection failed. Please check your internet connection.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    if (!isPinVerified) {
      return <PinScreen user={user} isDarkMode={isDarkMode} onSuccess={() => setIsPinVerified(true)} />;
    }
    return <Dashboard user={user} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-y-auto overflow-x-hidden p-4 sm:p-8 font-sans select-none transition-colors duration-500">
      
      {/* Atmospheric Background Elements */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-black/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

      {/* Main Login Card Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[420px] m-auto backdrop-blur-3xl bg-white/60 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-[32px] p-6 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)] transition-colors duration-500 my-8 sm:my-auto"
      >
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl font-black tracking-[0.3em] mb-2 uppercase text-black dark:text-white transition-colors duration-500"
          >
            Zymack
          </motion.h1>
          <p className="text-black/40 dark:text-white/40 text-xs tracking-[0.1em] uppercase transition-colors duration-500">
            {isSignUp ? 'Create Digital Asset Access' : 'Secure Digital Asset Access'}
          </p>
        </div>

        {error && (
          <div className="mb-4 text-center">
            <p className="text-red-500 text-xs bg-red-500/10 py-2 px-3 rounded-md">{error}</p>
          </div>
        )}

        {resetSent && (
          <div className="mb-4 text-center">
            <p className="text-emerald-500 text-[11px] bg-emerald-500/10 py-2 px-3 rounded-md">Password reset email sent! If you don't receive it, please check your spam folder or ensure you've registered an account with this email.</p>
          </div>
        )}

        {/* Social Authentication */}
        <div className="flex gap-3 mb-8">
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all group disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" fill="currentColor" className="w-4 h-4 text-black/60 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors">
              <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
            </svg>
            <span className="text-sm font-medium text-black/60 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors">Google</span>
          </button>
          <button type="button" onClick={handleAppleSignIn} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all group disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5 mb-[1px] text-black/60 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <span className="text-sm font-medium text-black/60 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors">Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-full h-[1px] bg-black/10 dark:bg-white/10 transition-colors duration-500"></div>
          <span className="relative z-10 px-4 bg-white dark:bg-[#050505] text-[10px] text-black/40 dark:text-white/30 uppercase tracking-widest rounded-full transition-colors duration-500">Or with email</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col gap-5 pb-1">
                  {/* First Name & Last Name */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 mb-2 ml-1 transition-colors duration-500">
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/30 dark:text-white/30 transition-colors duration-500">
                          <UserIcon size={16} />
                        </div>
                        <input
                          type="text"
                          required={isSignUp}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-all shadow-inner disabled:opacity-50"
                          placeholder="First"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 mb-2 ml-1 transition-colors duration-500">
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/30 dark:text-white/30 transition-colors duration-500">
                          <UserIcon size={16} />
                        </div>
                        <input
                          type="text"
                          required={isSignUp}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-all shadow-inner disabled:opacity-50"
                          placeholder="Last"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Referral Code */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 mb-2 ml-1 transition-colors duration-500">
                      Referral Code <span className="text-black/30 dark:text-white/30 lowercase tracking-normal bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded ml-1">Optional</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/30 dark:text-white/30 transition-colors duration-500">
                        <Tag size={16} />
                      </div>
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-all shadow-inner disabled:opacity-50 tracking-wider uppercase font-medium"
                        placeholder="e.g. ZYMACK24"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Email Field */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 mb-2 ml-1 transition-colors duration-500">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/30 dark:text-white/30 transition-colors duration-500">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-all shadow-inner disabled:opacity-50"
                placeholder="name@domain.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 ml-1 transition-colors duration-500">
                Password
              </label>
              {!isSignUp && (
                <button type="button" onClick={handleForgotPassword} className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50" disabled={loading}>
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/30 dark:text-white/30 transition-colors duration-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-all shadow-inner disabled:opacity-50"
                placeholder={isSignUp ? "Create a passkey" : "Enter password"}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            <AnimatePresence>
              {isSignUp && password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden flex items-center"
                >
                  <div className="flex gap-1.5 flex-1 p-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                          strengthScore >= level 
                            ? 'bg-black dark:bg-white' 
                            : 'bg-black/10 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-[9px] text-black/50 dark:text-white/60 uppercase tracking-tighter w-12 pt-0.5 text-right font-medium transition-colors duration-500">
                    {strengthLabels[strengthScore]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sub Actions (Remember Me) */}
          {!isSignUp && (
             <label className="flex items-center gap-2 pt-1 ml-1 cursor-pointer group w-max">
                <div className="relative flex items-center justify-center w-[14px] h-[14px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded overflow-hidden group-hover:border-black/30 dark:group-hover:border-white/30 transition-all shadow-inner">
                  <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer z-10" />
                  <motion.div 
                    className="absolute inset-[3px] bg-black dark:bg-white rounded-[2px] opacity-0 group-has-[:checked]:opacity-100 transition-opacity"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 group-hover:text-black/80 dark:group-hover:text-white/70 transition-colors pt-0.5">Remember me</span>
             </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-[0.1em] py-4 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Access Dashboard')}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <p className="text-xs text-black/50 dark:text-white/40 transition-colors duration-500">
            {isSignUp ? 'Already have an account?' : 'New to Zymack?'}
          </p>
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-black dark:text-white font-medium border-b border-black/20 dark:border-white/20 pb-0.5 hover:border-black/60 dark:hover:border-white/60 transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </motion.div>

      {/* Bottom Decorative Text */}
      <div className="absolute bottom-8 left-8 flex items-center gap-4 hidden md:flex transition-colors duration-500">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-black dark:bg-white transition-colors duration-500"></div>
          <div className="w-1 h-1 bg-black/20 dark:bg-white/20 transition-colors duration-500"></div>
          <div className="w-1 h-1 bg-black/20 dark:bg-white/20 transition-colors duration-500"></div>
        </div>
        <span className="text-[9px] text-black/40 dark:text-white/30 uppercase tracking-[0.3em] transition-colors duration-500">End-to-End Encryption Enabled</span>
      </div>
      <div className="absolute bottom-8 right-8 text-[9px] text-black/40 dark:text-white/30 uppercase tracking-[0.3em] hidden md:block transition-colors duration-500">
        v4.0.2 // NODE_SECURE
      </div>
    </div>
  );
}

