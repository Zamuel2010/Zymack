import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Wifi, Gamepad2, Gift, Zap, Tv, CreditCard, GraduationCap } from 'lucide-react';

export default function ServicesScreen() {
  const services = [
    {
      id: 'airtime',
      name: 'Airtime Recharge',
      description: 'Instant top-up for all networks',
      icon: <Smartphone size={24} />,
      image: 'https://picsum.photos/seed/mobiletopup/400/300?blur=2',
      color: 'bg-blue-500'
    },
    {
      id: 'data',
      name: 'Data Bundles',
      description: 'Cheap data for surfing',
      icon: <Wifi size={24} />,
      image: 'https://picsum.photos/seed/internetdata/400/300?blur=2',
      color: 'bg-emerald-500'
    },
    {
      id: 'betting',
      name: 'Sports Betting',
      description: 'Fund your betting wallet',
      icon: <Gamepad2 size={24} />,
      image: 'https://picsum.photos/seed/stadiumsports/400/300?blur=2',
      color: 'bg-amber-500'
    },
    {
      id: 'giftcards',
      name: 'Gift Cards',
      description: 'Trade & buy global gift cards',
      icon: <Gift size={24} />,
      image: 'https://picsum.photos/seed/giftcardsxyz/400/300?blur=2',
      color: 'bg-rose-500'
    },
    {
      id: 'electricity',
      name: 'Electricity Bills',
      description: 'Prepaid & postpaid meters',
      icon: <Zap size={24} />,
      image: 'https://picsum.photos/seed/powergrid/400/300?blur=2',
      color: 'bg-yellow-500'
    },
    {
      id: 'tv',
      name: 'Cable TV',
      description: 'DSTV, GOTV & Startimes',
      icon: <Tv size={24} />,
      image: 'https://picsum.photos/seed/television/400/300?blur=2',
      color: 'bg-purple-500'
    },
  ];

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

      <div className="mt-8 p-6 rounded-3xl bg-black dark:bg-white relative overflow-hidden group cursor-pointer">
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
