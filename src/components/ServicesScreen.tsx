import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Wifi, Gamepad2, Gift, Zap, Tv, CreditCard, ChevronLeft, ArrowRight, Loader2, CheckCircle2, Bitcoin } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const NETWORK_LOGOS: Record<string, string> = {
  'MTN': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ffcc00" /><circle cx="50" cy="50" r="35" fill="%23ffcc00" stroke="%23000" stroke-width="4" /><text x="50" y="58" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="%23000" text-anchor="middle">MTN</text></svg>',
  'AIRTEL': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ff0000" /><text x="50" y="58" font-family="Arial, sans-serif" font-weight="800" font-size="24" fill="%23fff" text-anchor="middle">airtel</text></svg>',
  'GLO': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23009933" /><circle cx="50" cy="50" r="30" fill="%23009933" stroke="%23fff" stroke-width="4" /><text x="50" y="58" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="%23fff" text-anchor="middle">glo</text></svg>',
  '9MOBILE': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23005500" /><text x="50" y="56" font-family="Arial, sans-serif" font-weight="800" font-size="18" fill="%23fff" text-anchor="middle">9mobile</text></svg>'
};

export default function ServicesScreen({ user }: { user: any }) {
  const [dataPlans, setDataPlans] = useState<Record<string, { id: string, name: string, price: number }[]>>({});
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
       try {
         const snap = await getDoc(doc(db, 'admin_settings', 'vtu'));
         if (snap.exists() && snap.data().dataPlans && Object.keys(snap.data().dataPlans).length > 0) {
            setDataPlans(snap.data().dataPlans);
         } else {
            // Fallback default plans
            setDataPlans({
              MTN: [
                { id: 'mtn_500mb_sme', name: '500MB (SME)', price: 185 },
                { id: 'mtn_1gb_sme', name: '1GB (SME)', price: 305 },
                { id: 'mtn_2gb_sme', name: '2GB (SME)', price: 560 },
                { id: 'mtn_3gb_sme', name: '3GB (SME)', price: 815 },
                { id: 'mtn_5gb_sme', name: '5GB (SME)', price: 1325 },
                { id: 'mtn_10gb_sme', name: '10GB (SME)', price: 2600 }
              ],
              AIRTEL: [
                { id: 'airtel_500mb', name: '500MB (CG)', price: 190 },
                { id: 'airtel_1gb', name: '1GB (CG)', price: 325 },
                { id: 'airtel_2gb', name: '2GB (CG)', price: 600 },
                { id: 'airtel_5gb', name: '5GB (CG)', price: 1425 },
                { id: 'airtel_10gb', name: '10GB (CG)', price: 2800 },
              ],
              GLO: [
                { id: 'glo_500mb', name: '500MB (CG)', price: 185 },
                { id: 'glo_1gb', name: '1GB (CG)', price: 305 },
                { id: 'glo_2gb', name: '2GB (CG)', price: 560 },
                { id: 'glo_3gb', name: '3GB (CG)', price: 815 },
                { id: 'glo_5gb', name: '5GB (CG)', price: 1325 },
                { id: 'glo_10gb', name: '10GB (CG)', price: 2600 },
              ],
              '9MOBILE': [
                { id: '9m_500mb', name: '500MB (SME)', price: 170 },
                { id: '9m_1gb', name: '1GB (SME)', price: 290 },
                { id: '9m_2gb', name: '2GB (SME)', price: 530 },
                { id: '9m_3gb', name: '3GB (SME)', price: 770 },
                { id: '9m_5gb', name: '5GB (SME)', price: 1250 },
                { id: '9m_10gb', name: '10GB (SME)', price: 2450 },
              ]
            });
         }
       } catch (e) {
         console.error('Failed to fetch data plans', e);
       } finally {
         setPlansLoading(false);
       }
    };
    fetchPlans();
  }, []);

  const [selectedService, setSelectedService] = useState<{ id: string, name: string } | null>(null);
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const services = [
    {
      id: 'airtime',
      name: 'Airtime Recharge',
      description: 'Instant top-up for all networks',
      icon: <Smartphone size={24} />,
      image: 'https://i.postimg.cc/8zC743rf/IMG-4098.jpg',
      color: 'bg-blue-500'
    },
    {
      id: 'data',
      name: 'Data Bundles',
      description: 'Cheap data for surfing',
      icon: <Wifi size={24} />,
      image: 'https://i.postimg.cc/9QzfZ7vC/IMG-4099.png',
      color: 'bg-emerald-500'
    },
    {
      id: 'giftcards',
      name: 'Gift Cards',
      description: 'Trade & buy global gift cards',
      icon: <Gift size={24} />,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
      color: 'bg-rose-500'
    },
    {
      id: 'electricity',
      name: 'Electricity Bills',
      description: 'Prepaid & postpaid meters',
      icon: <Zap size={24} />,
      image: 'https://i.postimg.cc/g08mHq4x/IMG-4100.jpg',
      color: 'bg-yellow-500'
    },
    {
      id: 'tv',
      name: 'Cable TV',
      description: 'DSTV, GOTV & Startimes',
      icon: <Tv size={24} />,
      image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop',
      color: 'bg-purple-500'
    },
  ];

  const handlePurchase = async () => {
    setMessage({ text: '', type: '' });
    setLoading(true);
    
    // Determine the actual amount based on service type
    let finalAmount = Number(amount);
    let planCode = '';

    if (selectedService?.id === 'data') {
       const selectedPlan = dataPlans[network]?.find(p => p.id === selectedPlanId);
       if (!selectedPlan) {
          setMessage({ text: 'Please select a data plan', type: 'error' });
          setLoading(false);
          return;
       }
       finalAmount = selectedPlan.price;
       planCode = selectedPlan.id; // Passing plan ID to external VTU API
    } else if (selectedService?.id === 'tv') {
       // Mock TV price derivation based on Plan ID chosen in UI
       const tvPrices: any = {
           pkg1: 29500,
           pkg2: 19800,
           pkg3: 12500,
           pkg4: 7400,
           pkg5: 4200
       };
       finalAmount = tvPrices[selectedPlanId] || 0;
       planCode = selectedPlanId;
    }
    
    if (!finalAmount || finalAmount <= 0) {
       setMessage({ text: 'Invalid amount', type: 'error' });
       setLoading(false);
       return;
    }

    try {
      const res = await fetch('/api/vtu/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          service: selectedService?.id,
          network,
          phone,
          amount: finalAmount,
          plan: planCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to purchase');
      
      let serviceName = 'Airtime';
      if (selectedService?.id === 'data') serviceName = 'Data';
      if (selectedService?.id === 'electricity') serviceName = 'Electricity';
      if (selectedService?.id === 'tv') serviceName = 'TV Subscription';

      setMessage({ text: `Successfully purchased ${serviceName} for ${phone}!`, type: 'success' });
      setPhone('');
      setAmount('');
      setSelectedPlanId('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderDataPlans = () => {
    if (plansLoading) {
      return (
        <div className="flex justify-center items-center py-6 mt-4 opacity-50">
          <Loader2 className="animate-spin text-black dark:text-white" size={24} />
        </div>
      );
    }
    const plans = dataPlans[network] || [];
    
    if (plans.length === 0) {
      return (
        <div className="mt-4 p-4 text-center text-sm font-bold text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/5 rounded-2xl">
          No data plans available for {network}.<br/>
          (Try checking the Admin Dashboard VTU Pricing)
        </div>
      );
    }

    return (
      <div className="mt-4">
        <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Available Plans</label>
        <div className="grid grid-cols-2 gap-3">
           {plans.map(plan => (
             <button
               key={plan.id}
               onClick={() => setSelectedPlanId(plan.id)}
               className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  selectedPlanId === plan.id
                   ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                   : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
               }`}
             >
               <span className={`text-[15px] font-black mb-1 text-center leading-tight ${selectedPlanId === plan.id ? 'text-emerald-500' : 'text-black/80 dark:text-white/80'}`}>{plan.name}</span>
               <span className="text-[13px] font-bold text-black/50 dark:text-white/50">₦{plan.price}</span>
             </button>
           ))}
        </div>
      </div>
    );
  };

  if (selectedService && selectedService.id === 'airtime') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex flex-col pb-6 w-full"
      >
        <div className="flex items-center mb-6 mt-4">
          <button 
            onClick={() => { setSelectedService(null); setMessage({text:'', type:''}); setAmount(''); setPhone(''); }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">{selectedService.name}</h2>
            <p className="text-sm font-medium text-black/50 dark:text-white/50">{selectedService.description}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Choose Network</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <img src={NETWORK_LOGOS[network]} className="w-8 h-8 rounded-full shadow-sm" alt={network} />
              </div>
              <select 
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl pl-16 pr-10 py-5 text-black dark:text-white font-bold text-lg appearance-none cursor-pointer outline-none transition-all"
              >
                {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => (
                  <option key={net} value={net} className="text-black">{net}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 dark:text-white/40">
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Phone Number</label>
            <div className="relative">
               <input 
                 type="tel"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                 placeholder="Enter phone number"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
               {phone.length >= 10 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                     <CheckCircle2 size={24} />
                  </div>
               )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Amount (NGN)</label>
            <div className="relative">
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 font-bold text-xl">₦</span>
               <input 
                 type="number"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="1000"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl pl-10 pr-5 py-4 text-black dark:text-white font-bold text-xl placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold mt-2 flex items-center justify-between ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePurchase}
              disabled={loading || !(phone && amount)}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg ${
                (phone && amount)
                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.98]'
                 : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Pay {amount ? `₦${amount}` : ''} <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedService && selectedService.id === 'data') {
    const isValidToPay = phone && selectedPlanId;

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex flex-col pb-6 w-full"
      >
        <div className="flex items-center mb-6 mt-4">
          <button 
            onClick={() => { setSelectedService(null); setMessage({text:'', type:''}); setSelectedPlanId(''); setAmount(''); setPhone(''); }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">{selectedService.name}</h2>
            <p className="text-sm font-medium text-black/50 dark:text-white/50">{selectedService.description}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Choose Network</label>
            <div className="grid grid-cols-2 gap-4">
              {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map(net => {
                const isActive = network === net;
                return (
                  <button
                    key={net}
                    onClick={() => { setNetwork(net); setSelectedPlanId(''); }}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all border-2 ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 scale-[1.02] shadow-sm' 
                        : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <img src={NETWORK_LOGOS[net]} className="w-14 h-14 rounded-full shadow-md mb-3" alt={net} />
                    <span className={`text-sm font-black ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-black/70 dark:text-white/70'}`}>{net}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {renderDataPlans()}

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Phone Number</label>
            <div className="relative">
               <input 
                 type="tel"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                 placeholder="Enter phone number"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
               {phone.length >= 10 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                     <CheckCircle2 size={24} />
                  </div>
               )}
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold mt-2 flex items-center justify-between ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePurchase}
              disabled={loading || !isValidToPay}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg ${
                isValidToPay
                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.98]'
                 : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Pay {selectedPlanId ? `₦${dataPlans[network]?.find(p => p.id === selectedPlanId)?.price}` : ''} <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedService && selectedService.id === 'electricity') {
    const isValidToPay = phone && amount;

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex flex-col pb-6 w-full"
      >
        <div className="flex items-center mb-6 mt-4">
          <button 
            onClick={() => { setSelectedService(null); setMessage({text:'', type:''}); setAmount(''); setPhone(''); }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">{selectedService.name}</h2>
            <p className="text-sm font-medium text-black/50 dark:text-white/50">{selectedService.description}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Provider</label>
            <div className="relative">
              <select 
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-5 text-black dark:text-white font-bold text-lg appearance-none cursor-pointer outline-none transition-all"
              >
                {['IKEDC', 'EKEDC', 'AEDC', 'KEDCO', 'PHED', 'IBEDC', 'JEDC'].map(net => (
                  <option key={net} value={net} className="text-black">{net} - Electric</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 dark:text-white/40">
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Meter Type</label>
             <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                 <button className="flex-1 py-3 text-sm font-bold bg-white dark:bg-[#222] text-black dark:text-white rounded-xl shadow-sm">Prepaid</button>
                 <button className="flex-1 py-3 text-sm font-bold text-black/50 dark:text-white/50">Postpaid</button>
             </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Meter Number</label>
            <div className="relative">
               <input 
                 type="text"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 20))}
                 placeholder="Enter meter number"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Amount (NGN)</label>
            <div className="relative">
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 font-bold text-xl">₦</span>
               <input 
                 type="number"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="5000"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl pl-10 pr-5 py-4 text-black dark:text-white font-bold text-xl placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold mt-2 flex items-center justify-between ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePurchase}
              disabled={loading || !isValidToPay}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg ${
                isValidToPay
                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.98]'
                 : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Pay {amount ? `₦${amount}` : ''} <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedService && selectedService.id === 'tv') {
    const isValidToPay = phone && selectedPlanId;

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex flex-col pb-6 w-full"
      >
        <div className="flex items-center mb-6 mt-4">
          <button 
            onClick={() => { setSelectedService(null); setMessage({text:'', type:''}); setSelectedPlanId(''); setAmount(''); setPhone(''); }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">{selectedService.name}</h2>
            <p className="text-sm font-medium text-black/50 dark:text-white/50">{selectedService.description}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Choose Provider</label>
            <div className="relative">
              <select 
                value={network}
                onChange={(e) => { setNetwork(e.target.value); setSelectedPlanId(''); }}
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-5 text-black dark:text-white font-bold text-lg appearance-none cursor-pointer outline-none transition-all"
              >
                {['DSTV', 'GOTV', 'STARTIMES'].map(net => (
                  <option key={net} value={net} className="text-black">{net}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 dark:text-white/40">
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">TV Package</label>
             <div className="relative">
              <select 
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-5 text-black dark:text-white font-bold text-base appearance-none cursor-pointer outline-none transition-all"
              >
                <option value="" disabled className="text-black">Select a package...</option>
                <option value="pkg1" className="text-black">Premium - ₦29,500</option>
                <option value="pkg2" className="text-black">Compact Plus - ₦19,800</option>
                <option value="pkg3" className="text-black">Compact - ₦12,500</option>
                <option value="pkg4" className="text-black">Confam - ₦7,400</option>
                <option value="pkg5" className="text-black">Yanga - ₦4,200</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 dark:text-white/40">
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-2 block">Smart Card / IUC Number</label>
            <div className="relative">
               <input 
                 type="text"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                 placeholder="Enter IUC number"
                 className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-lg placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all"
               />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold mt-2 flex items-center justify-between ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <span>{message.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePurchase}
              disabled={loading || !isValidToPay}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg ${
                isValidToPay
                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.98]'
                 : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>Pay & Renew <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedService && (selectedService.id === 'giftcards' || selectedService.id === 'crypto')) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex flex-col pb-6 w-full items-center justify-center pt-10"
      >
        <div className="flex items-center mb-10 w-full">
          <button 
            onClick={() => { setSelectedService(null); }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">{selectedService.name}</h2>
          </div>
        </div>

        <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          {selectedService.id === 'crypto' ? <Bitcoin size={40} className="text-black/50 dark:text-white/50" /> : <Gift size={40} className="text-black/50 dark:text-white/50" />}
        </div>
        
        <h3 className="text-2xl font-black text-black dark:text-white mb-3 tracking-tight text-center">Coming Soon in V2!</h3>
        <p className="text-black/60 dark:text-white/60 text-center font-medium leading-relaxed max-w-sm">
          We are working hard to bring you the best experience for {selectedService.name}. This feature will be rolled out in our highly anticipated V2 update. Stay tuned!
        </p>
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
        <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Services</h2>
        <p className="text-sm font-medium text-black/50 dark:text-white/50 mt-1">Pay bills and buy essentials instantly.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {services.map((service, i) => (
          <motion.div
            key={service.id}
            onClick={() => setSelectedService({ id: service.id, name: service.name })}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative rounded-3xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 aspect-[4/5] cursor-pointer"
          >
            {/* Background Image */}
            <img 
              src={service.image} 
              alt={service.name} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start">
              <div className={`w-10 h-10 rounded-2xl ${service.color} text-white flex items-center justify-center mb-3 shadow-lg shadow-black/20`}>
                {service.icon}
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{service.name}</h3>
              <p className="text-[10px] text-white/70 font-medium leading-tight line-clamp-2">{service.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div 
        onClick={() => setSelectedService({ id: 'crypto', name: 'Buy Crypto' })}
        className="mt-8 p-6 rounded-3xl bg-black dark:bg-white relative overflow-hidden group cursor-pointer"
      >
         {/* Beautiful gradient background for the promo card */}
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-300 via-emerald-500 to-transparent blur-2xl group-hover:opacity-40 transition-opacity"></div>
         <div className="relative z-10 flex items-center justify-between">
            <div>
               <h3 className="text-lg font-black text-white dark:text-black mb-1">Buy Crypto</h3>
               <p className="text-xs text-white/60 dark:text-black/60 font-medium">Fund your wallet with fiat</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
               <CreditCard size={24} className="text-white dark:text-black" />
            </div>
         </div>
      </div>
    </motion.div>
  );
}
