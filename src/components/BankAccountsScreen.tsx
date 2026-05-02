import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Building, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, query, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

interface BankAccountsScreenProps {
  onBack: () => void;
  uid: string;
}

const POPULAR_BANKS = ['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'First Bank', 'Moniepoint', 'Opay', 'Palmpay'];

export default function BankAccountsScreen({ onBack, uid }: BankAccountsScreenProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [bankName, setBankName] = useState('GTBank');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const fetchAccounts = async () => {
     setLoading(true);
     try {
       const q = query(collection(db, 'wallets', uid, 'bankAccounts'));
       const snap = await getDocs(q);
       setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     } catch(e) {
       console.error("Failed to load banks", e);
     }
     setLoading(false);
  };

  useEffect(() => {
     fetchAccounts();
  }, [uid]);

  const handleAdd = async () => {
     if (!bankName || !accountName || !accountNumber) return;
     try {
       const newRef = doc(collection(db, 'wallets', uid, 'bankAccounts'));
       await setDoc(newRef, {
         bankName,
         accountName,
         accountNumber,
         createdAt: new Date().toISOString()
       });
       setShowAdd(false);
       setAccountName('');
       setAccountNumber('');
       fetchAccounts();
     } catch(e) {
       console.error(e);
     }
  };

  const handleDelete = async (id: string) => {
     try {
       await deleteDoc(doc(db, 'wallets', uid, 'bankAccounts', id));
       fetchAccounts();
     } catch(e) {
       console.error(e);
     }
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
        <div className="flex-1">
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
             Bank Accounts
          </h2>
          <p className="text-xs text-black/60 dark:text-white/60">Manage your withdrawal methods</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black hover:bg-black/80 transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {showAdd ? (
           <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-black dark:text-white">Add New Bank Account</h3>
              
              <div>
                 <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2">Select Bank</label>
                 <select 
                   value={bankName}
                   onChange={(e) => setBankName(e.target.value)}
                   className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                 >
                    {POPULAR_BANKS.map(b => (
                       <option key={b} value={b}>{b}</option>
                    ))}
                 </select>
              </div>

              <div>
                 <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2">Account Number</label>
                 <input 
                   value={accountNumber}
                   onChange={(e) => setAccountNumber(e.target.value)}
                   placeholder="10 digits"
                   type="text"
                   maxLength={10}
                   className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                 />
              </div>

              <div>
                 <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-2">Account Name</label>
                 <input 
                   value={accountName}
                   onChange={(e) => setAccountName(e.target.value)}
                   placeholder="John Doe"
                   type="text"
                   className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                 />
              </div>

              <div className="flex gap-3 pt-4">
                 <button onClick={() => setShowAdd(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 transition-colors">Cancel</button>
                 <button onClick={handleAdd} className="flex-1 py-3 px-4 rounded-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 transition-colors">Save Bank</button>
              </div>
           </div>
        ) : (
           <div className="flex flex-col gap-4">
              {loading ? (
                 <p className="text-sm text-center text-black/40">Loading...</p>
              ) : accounts.length === 0 ? (
                 <div className="text-center py-10 opacity-50 flex flex-col items-center">
                    <Building size={32} className="mb-3 text-black/40 dark:text-white/40" />
                    <p className="font-medium text-black dark:text-white">No banks added yet</p>
                    <p className="text-xs mt-1">Add a bank to enable fiat withdrawals</p>
                 </div>
              ) : (
                 accounts.map(acc => (
                    <div key={acc.id} className="bg-white dark:bg-[#111111] p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between group flex-wrap">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                             <Building size={18} className="text-black/60 dark:text-white/60" />
                          </div>
                          <div>
                             <h4 className="font-bold text-black dark:text-white text-sm">{acc.bankName}</h4>
                             <p className="text-xs font-mono text-black/60 dark:text-white/60">{acc.accountNumber}</p>
                             <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">{acc.accountName}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDelete(acc.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                       </button>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>
    </div>
  );
}
