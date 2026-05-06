import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, collection, query, orderBy, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, ArrowUpRight, ArrowDownLeft, 
  Home, Activity, User as UserIcon, Copy, Check,
  QrCode, TrendingUp, History, CreditCard, ChevronRight,
  LogOut, Plus, Wallet, Sun, Moon, LayoutGrid, Gift, ShieldCheck, Users,
  Lock, HelpCircle, Calculator, Loader2, Settings
} from 'lucide-react';
import DepositScreen from './DepositScreen';
import WithdrawScreen from './WithdrawScreen';
import NotificationsPanel from './NotificationsPanel';
import AdminPanel from './AdminPanel';
import CalculatorModal from './CalculatorModal';
import TransactionReceiptModal from './TransactionReceiptModal';
import ReferralScreen from './ReferralScreen';
import BankAccountsScreen from './BankAccountsScreen';
import ServicesScreen from './ServicesScreen';
import CardScreen from './CardScreen';
import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './SettingsScreen';

interface DashboardProps {
  user: User;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Dashboard({ user, isDarkMode, toggleDarkMode }: DashboardProps) {
  const [copied, setCopied] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  // Pull-to-refresh state
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.4, 80)); 
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      // Simulate refetch since onSnapshot is already active
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  const unreadCount = transactions.filter(tx => !tx.isRead).length;

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadTxs = transactions.filter(tx => !tx.isRead);
    for (const tx of unreadTxs) {
      try {
        await setDoc(doc(db, 'wallets', user.uid, 'transactions', tx.id), { isRead: true }, { merge: true });
      } catch(e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const walletRef = doc(db, 'wallets', user.uid);
    const unsubWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.totalBalance || 0);
      } else {
        // Init wallet safely
        setDoc(walletRef, { totalBalance: 0, currency: 'NGN', createdAt: new Date().toISOString() })
          .catch(err => console.error("Failed to initialize wallet:", err));
        setBalance(0);
      }
    }, (err) => {
      console.error("Wallet snapshot error:", err);
    });

    const txRef = collection(db, 'wallets', user.uid, 'transactions');
    const q = query(txRef, orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Transactions snapshot error:", err);
    });

    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (snapshot) => {
       if (snapshot.exists()) {
          setUserData(snapshot.data());
       }
    });

    return () => {
      unsubWallet();
      unsubTx();
      unsubUser();
    };
  }, [user]);

  const copyId = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortId = user.uid.substring(0, 8).toUpperCase();

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="fixed inset-0 w-full bg-[#f8f9fc] dark:bg-[#050505] text-[#050505] dark:text-white flex justify-center font-sans transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[480px] bg-white dark:bg-[#0A0A0A] h-full relative shadow-2xl flex flex-col border-x border-black/5 dark:border-white/5 transition-colors duration-500 overflow-hidden">
        
        <style>
          {`
            .hidden-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hidden-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>

        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-black/5 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
        <div className="absolute top-[30%] right-[-20%] w-[300px] h-[300px] bg-black/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

        {/* Header */}
        {activeTab !== 'Account' && (
          <div className="flex justify-between items-center px-6 pt-12 pb-6 relative z-10 w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden transition-colors duration-500">
                {userData?.profilePic || user.photoURL ? (
                  <img src={userData?.profilePic || user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-black/60 dark:text-white/60 transition-colors duration-500" />
                )}
              </div>
              <div>
                <p className="text-black/40 dark:text-white/40 text-[10px] tracking-widest uppercase mb-0.5 transition-colors duration-500">Welcome back</p>
                <h2 className="text-sm font-bold text-black/90 dark:text-white/90 transition-colors duration-500">
                  {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : user.displayName || 'Anonymous User'}
                </h2>
                <button 
                  onClick={copyId}
                  className="flex items-center gap-1.5 mt-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                  title="Copy ID"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-[10px] text-black/60 dark:text-white/60 font-mono tracking-wider transition-colors duration-500">ID: {shortId}</p>
                  {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-black/40 dark:text-white/40 transition-colors duration-500" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors group">
                {isDarkMode ? <Sun size={18} className="text-white/80 group-hover:text-white transition-colors" /> : <Moon size={18} className="text-black/80 group-hover:text-black transition-colors" />}
              </button>
              <button 
                onClick={() => {
                  setShowNotifications(true);
                  markAllAsRead();
                }}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative"
              >
                <Bell size={18} className="text-black/80 dark:text-white/80 transition-colors duration-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] transition-colors duration-500">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div 
          className="flex-1 px-6 pb-32 relative z-10 w-full pt-4 overflow-y-auto hidden-scrollbar"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull to refresh visual */}
          <motion.div 
            className="w-full flex justify-center overflow-hidden"
            animate={{ height: isRefreshing ? 60 : pullDistance }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="h-full flex items-center justify-center opacity-70">
               {isRefreshing ? (
                 <Loader2 size={24} className="animate-spin text-black dark:text-white" />
               ) : (
                 <ArrowDownLeft size={24} className="text-black dark:text-white" style={{ transform: `rotate(${Math.min(pullDistance * 3, 180)}deg)` }} />
               )}
            </div>
          </motion.div>

          {activeTab === 'Home' && (
            <>
              {/* Total Balance Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-[28px] p-6 mb-6 relative overflow-hidden backdrop-blur-xl shadow-xl transition-colors duration-500"
              >
                <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none transition-colors duration-500"></div>
                
                <p className="text-black/60 dark:text-white/50 text-xs font-medium mb-2 transition-colors duration-500">Total Balance (NGN)</p>
                <div className="flex items-end gap-3 mb-8">
                  <h1 className="text-4xl font-black tracking-tight text-black dark:text-white/90 transition-colors duration-500">
                    {balance !== null ? formatNaira(balance) : '₦...'}
                  </h1>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-between items-center bg-black/5 dark:bg-black/40 rounded-[20px] p-2 border border-black/10 dark:border-white/5 gap-2 backdrop-blur-md transition-colors duration-500">
                  <button 
                    onClick={() => setShowDeposit(true)}
                    className="flex-1 flex flex-col items-center justify-center py-3 px-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-colors duration-500">
                      <ArrowDownLeft size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold text-black/80 dark:text-white/80 tracking-wide transition-colors duration-500">Deposit</span>
                  </button>
                  <button 
                    onClick={() => setShowWithdraw(true)}
                    className="flex-1 flex flex-col items-center justify-center py-3 px-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center mb-2 transition-colors duration-500">
                      <ArrowUpRight size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-black/80 dark:text-white/80 tracking-wide transition-colors duration-500">Withdraw</span>
                  </button>
                  <button 
                    onClick={() => setShowCalculator(true)}
                    className="flex-1 flex flex-col items-center justify-center py-3 px-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center mb-2 transition-colors duration-500">
                      <Calculator size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-black/80 dark:text-white/80 tracking-wide transition-colors duration-500">Calculate</span>
                  </button>
                </div>
              </motion.div>

              {/* Transactions Section */}
              <div className="mb-4 flex justify-between items-end">
                <h3 className="text-lg font-bold text-black/90 dark:text-white/90 transition-colors duration-500">Recent Transactions</h3>
                {transactions.length > 0 && (
                  <button 
                    onClick={() => {
                      setShowNotifications(true);
                      markAllAsRead();
                    }}
                    className="text-[11px] font-medium text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors uppercase tracking-wider"
                  >
                    See All
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Wallet size={32} className="mb-3 text-black/40 dark:text-white/40 transition-colors duration-500" />
                    <p className="text-sm font-medium text-black dark:text-white transition-colors duration-500">No transactions yet</p>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1 transition-colors duration-500">Your recent activity will appear here.</p>
                  </div>
                ) : (
                  transactions.map((tx, i) => (
                    <motion.div 
                      onClick={() => setSelectedTx(tx)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-[20px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner font-medium transition-colors duration-500 ${tx.type === 'receive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/80 dark:text-white/80'}`}>
                          {tx.type === 'receive' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-black/90 dark:text-white/90 transition-colors duration-500">{tx.title || (tx.type === 'receive' ? 'Received Money' : 'Sent Money')}</h4>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-black/40 dark:text-white/40 font-medium transition-colors duration-500">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Pending'}
                            </p>
                            {tx.txId && (tx.cryptoAmount || tx.type === 'deposit') && (
                              <p className="text-[9px] font-mono text-black/30 dark:text-white/30 truncate max-w-[120px]" title={tx.txId}>
                                TX: {tx.txId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-sm tracking-tight text-black/90 dark:text-white/90 transition-colors duration-500">
                          {tx.type === 'receive' ? '+' : '-'}{formatNaira(tx.amount || 0)}
                        </h4>
                        <p className={`text-[11px] font-medium mt-0.5 ${tx.status === 'success' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                          {tx.status || 'Completed'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'Services' && (
            <ServicesScreen user={user} />
          )}

          {activeTab === 'Cards' && (
            <CardScreen user={user} balance={balance || 0} userData={userData} />
          )}

          {activeTab === 'Account' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col py-6 w-full">
              {/* Account Header */}
              <div className="flex flex-col items-center gap-3 mb-10 text-center w-full mt-4">
                <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                  {userData?.profilePic || user.photoURL ? (
                    <img src={userData?.profilePic || user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={36} className="text-black/60 dark:text-white/60" />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-2xl font-black tracking-tight text-black/90 dark:text-white/90">
                    {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : user.displayName || 'Anonymous User'}
                  </h3>
                  <div className="flex flex-col items-center mt-1">
                    <span 
                      onClick={copyId}
                      className="text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      @{shortId} {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded mt-2 uppercase tracking-widest">Unverified</span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col gap-2">
                
                {/* Refer and Earn */}
                <div 
                  onClick={() => setShowReferral(true)}
                  className="flex items-center justify-between p-4 rounded-[20px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors cursor-pointer group mb-4 relative overflow-hidden"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[30px] pointer-events-none"></div>
                   <div className="flex items-center gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                       <Gift size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Refer and Earn</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Invite your friends and earn on Zymack</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40" />
                </div>

                {/* My profile */}
                <div 
                   onClick={() => setShowEditProfile(true)}
                   className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <UserIcon size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">My profile</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Edit your account information</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Verify your account */}
                <div className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <ShieldCheck size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Verify your account</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Upgrade your tier limits</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Spending limits */}
                <div className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <Activity size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Spending limits</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">See spending limits</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Security & Settings */}
                <div 
                   onClick={() => setShowSettings(true)}
                   className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <Settings size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Security & Privacy</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Reset PIN & Change Password</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Transactions */}
                <div 
                  className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  onClick={() => {
                     setShowNotifications(true);
                     markAllAsRead();
                  }}
                >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <History size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Transactions</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">See all transactions</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Beneficiaries / Bank Accounts */}
                <div 
                  onClick={() => setShowBankAccounts(true)}
                  className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <Users size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Beneficiaries</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Manage saved accounts</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Notifications */}
                <div 
                  className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  onClick={() => {
                     setShowNotifications(true);
                     markAllAsRead();
                  }}
                >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <Bell size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Notifications</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">View notifications and history</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Security */}
                <div className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <Lock size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Security</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Password, PIN, and biometrics</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Support */}
                <div className="flex items-center justify-between p-4 rounded-[20px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 flex items-center justify-center">
                       <HelpCircle size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-sm text-black/90 dark:text-white/90">Support</h4>
                       <p className="text-xs text-black/50 dark:text-white/50 font-medium">Get help and contact us</p>
                     </div>
                   </div>
                   <ChevronRight size={18} className="text-black/40 dark:text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>

              </div>

              <div className="mt-8 mb-4">
                <button 
                  onClick={() => auth.signOut()}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[20px] bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-bold"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>

            </motion.div>
          )}

          {activeTab === 'Admin' && user.email === 'samadeniji852@gmail.com' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col py-0 w-full">
               <AdminPanel isDarkMode={isDarkMode} />
            </motion.div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full max-w-[480px] bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-2xl border-t border-black/5 dark:border-white/5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 px-6 z-20 transition-colors duration-500">
          <div className="flex justify-between items-center max-w-[380px] mx-auto">
            <button 
              onClick={() => setActiveTab('Home')}
              className={`flex flex-col items-center gap-1.5 transition-colors duration-500 ${activeTab === 'Home' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'}`}
            >
              <Home size={22} strokeWidth={activeTab === 'Home' ? 2.5 : 2} className={activeTab === 'Home' ? 'fill-black/10 dark:fill-white/10' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button 
              onClick={() => setActiveTab('Services')}
              className={`flex flex-col items-center gap-1.5 transition-colors duration-500 ${activeTab === 'Services' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'}`}
            >
              <LayoutGrid size={22} strokeWidth={activeTab === 'Services' ? 2.5 : 2} className={activeTab === 'Services' ? 'fill-black/10 dark:fill-white/10' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Services</span>
            </button>
            <button 
              onClick={() => setActiveTab('Cards')}
              className={`flex flex-col items-center gap-1.5 transition-colors duration-500 ${activeTab === 'Cards' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'}`}
            >
              <CreditCard size={22} strokeWidth={activeTab === 'Cards' ? 2.5 : 2} className={activeTab === 'Cards' ? 'fill-black/10 dark:fill-white/10' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Cards</span>
            </button>
            <button 
              onClick={() => setActiveTab('Account')}
              className={`flex flex-col items-center gap-1.5 transition-colors duration-500 ${activeTab === 'Account' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'}`}
            >
              <UserIcon size={22} strokeWidth={activeTab === 'Account' ? 2.5 : 2} className={activeTab === 'Account' ? 'fill-black/10 dark:fill-white/10' : ''} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Account</span>
            </button>
            {user.email === 'samadeniji852@gmail.com' && (
              <button 
                onClick={() => setActiveTab('Admin')}
                className={`flex flex-col items-center gap-1.5 transition-colors duration-500 ${activeTab === 'Admin' ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'}`}
              >
                <ShieldCheck size={22} strokeWidth={activeTab === 'Admin' ? 2.5 : 2} className={activeTab === 'Admin' ? 'fill-black/10 dark:fill-white/10' : ''} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Deposit Screen Overlay */}
        <AnimatePresence>
          {showDeposit && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 rounded-t-[32px] overflow-hidden"
            >
              <DepositScreen onBack={() => setShowDeposit(false)} isDarkMode={isDarkMode} user={user} />
            </motion.div>
          )}

          {/* Withdraw Screen Overlay */}
          {showWithdraw && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 rounded-[32px] sm:rounded-none overflow-hidden"
            >
              <WithdrawScreen user={user} balance={balance || 0} onBack={() => setShowWithdraw(false)} />
            </motion.div>
          )}

          {/* Notifications Panel Overlay */}
          {showNotifications && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 overflow-hidden"
            >
              <NotificationsPanel 
                onBack={() => setShowNotifications(false)} 
                uid={user?.uid || ''}
                transactions={transactions} 
                isDarkMode={isDarkMode} 
                onSelectTx={(tx) => {
                   setShowNotifications(false);
                   setSelectedTx(tx);
                }}
              />
            </motion.div>
          )}

          {/* Calculator Overlay */}
          {showCalculator && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 overflow-hidden"
            >
              <CalculatorModal onBack={() => setShowCalculator(false)} uid={user.uid} />
            </motion.div>
          )}

          {/* Edit Profile Overlay */}
          <AnimatePresence>
            {showEditProfile && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 overflow-hidden"
              >
                <EditProfileScreen onBack={() => setShowEditProfile(false)} user={user} isDarkMode={isDarkMode} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings Overlay */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 overflow-hidden"
              >
                <SettingsScreen onBack={() => setShowSettings(false)} user={user} isDarkMode={isDarkMode} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Referral Screen Overlay */}
          {showReferral && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 overflow-hidden"
            >
              <ReferralScreen onBack={() => setShowReferral(false)} uid={user.uid} />
            </motion.div>
          )}

          {/* Bank Accounts Overlay */}
          {showBankAccounts && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 overflow-hidden"
            >
              <BankAccountsScreen onBack={() => setShowBankAccounts(false)} uid={user.uid} />
            </motion.div>
          )}

          {/* Transaction Receipt Modal */}
          {selectedTx && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[60] overflow-hidden"
            >
              <TransactionReceiptModal 
                tx={selectedTx} 
                onBack={() => setSelectedTx(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
