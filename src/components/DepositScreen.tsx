import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Search, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface DepositScreenProps {
  user: User;
  onBack: () => void;
  isDarkMode: boolean;
}

const CRYPTOS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg', networks: ['Bitcoin'] },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', networks: ['ERC20', 'Arbitrum', 'Optimism', 'Base'] },
  { id: 'usdt', name: 'Tether US', symbol: 'USDT', iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.svg', networks: ['TRC20', 'ERC20', 'Polygon', 'Solana', 'Arbitrum'] },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg', networks: ['ERC20', 'Solana', 'Polygon', 'Base'] },
  { id: 'sol', name: 'Solana', symbol: 'SOL', iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg', networks: ['Solana'] },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg', networks: ['BEP20'] },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', iconUrl: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg', networks: ['XRP'] },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.svg', networks: ['Cardano'] },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', iconUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg', networks: ['Dogecoin'] },
  { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', iconUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg', networks: ['ERC20'] },
];

export default function DepositScreen({ user, onBack, isDarkMode }: DepositScreenProps) {
  const [step, setStep] = useState<'crypto' | 'network' | 'address'>('crypto');
  const [search, setSearch] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTOS[0] | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (step === 'address' && selectedCrypto && selectedNetwork) {
      const fetchAddress = async () => {
        setLoadingAddress(true);
        try {
           const id = `${selectedCrypto.id}_${selectedNetwork.replace(/[^a-zA-Z0-9]/g, '')}`;
           const docRef = doc(db, 'wallets', user.uid, 'addresses', id);
           const snap = await getDoc(docRef);
           if (snap.exists()) {
              setDepositAddress(snap.data().address);
           } else {
              // Call our backend API which integrates with Tatum
              const response = await fetch('/api/tatum/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  crypto: selectedCrypto.id,
                  network: selectedNetwork,
                  uid: user.uid
                })
              });
              
              if (!response.ok) {
                throw new Error("Failed to generate deposit address");
              }

              const { address } = await response.json();
              
              await setDoc(docRef, {
                 cryptoId: selectedCrypto.id,
                 network: selectedNetwork,
                 address: address,
                 createdAt: new Date().toISOString()
              });
              setDepositAddress(address);
           }
        } catch(e) {
           console.error(e);
        } finally {
           setLoadingAddress(false);
        }
      };
      fetchAddress();
    }
  }, [step, selectedCrypto, selectedNetwork, user.uid]);

  const handleCopy = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredCryptos = CRYPTOS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-white dark:bg-[#0A0A0A] z-50 flex flex-col overflow-hidden transition-colors duration-500">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      
      {/* Header */}
      <div className="flex items-center px-6 pt-12 pb-4 relative z-10 w-full">
        <button 
          onClick={() => {
            if (step === 'address') setStep('network');
            else if (step === 'network') setStep('crypto');
            else onBack();
          }}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-black/90 dark:text-white/90 ml-4">
          {step === 'crypto' ? 'Select Crypto' : step === 'network' ? 'Select Network' : 'Deposit'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-20 overflow-y-auto hidden-scrollbar relative z-10">
        
        <AnimatePresence mode="wait">
          {step === 'crypto' && (
            <motion.div
              key="crypto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                <input 
                  type="text"
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="mt-2 text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest px-2">
                All Assets
              </div>

              <div className="flex flex-col gap-2">
                {filteredCryptos.map(crypto => (
                  <button
                    key={crypto.id}
                    onClick={() => {
                      setSelectedCrypto(crypto);
                      setStep('network');
                    }}
                    className="flex items-center justify-between p-4 rounded-[20px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                        <img src={crypto.iconUrl} alt={crypto.name} className="w-6 h-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-black/90 dark:text-white/90">{crypto.name}</h4>
                        <p className="text-xs text-black/50 dark:text-white/50 font-medium">{crypto.symbol}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'network' && selectedCrypto && (
            <motion.div
              key="network"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-[20px] p-4 mb-2">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Please make sure you select the correct network. Deposits via wrong networks may result in loss of funds.
                </p>
              </div>

              <div className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest px-2">
                Choose Network
              </div>

              <div className="flex flex-col gap-2">
                {selectedCrypto.networks.map(network => (
                  <button
                    key={network}
                    onClick={() => {
                      setSelectedNetwork(network);
                      setStep('address');
                    }}
                    className="flex items-center justify-between p-4 rounded-[20px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-black/90 dark:text-white/90">{network}</h4>
                      <p className="text-xs text-black/50 dark:text-white/50 font-medium">Arrival time: ~5 mins</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'address' && selectedCrypto && selectedNetwork && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center pt-8"
            >
              {/* QR Code */}
              <div className="w-56 h-56 bg-white rounded-3xl p-4 flex items-center justify-center shadow-xl mb-8 relative">
                 <div className="w-full h-full flex items-center justify-center rounded-xl relative overflow-hidden">
                    {loadingAddress || !depositAddress ? (
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    ) : (
                      <QRCode
                        value={depositAddress}
                        size={180}
                        level="H"
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    )}
                 </div>
                 {!loadingAddress && depositAddress && (
                   <div className="absolute w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-[3px] border-white">
                     <img src={selectedCrypto.iconUrl} alt={selectedCrypto.symbol} className="w-7 h-7 object-contain" />
                   </div>
                 )}
              </div>

              <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-2">
                Deposit Address
              </p>
              
              <div className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[24px] p-4 flex items-center justify-between group">
                <p className="text-sm font-mono text-black/80 dark:text-white/80 font-medium truncate mr-4">
                  {loadingAddress ? 'Generating...' : depositAddress}
                </p>
                <button 
                  onClick={handleCopy}
                  disabled={loadingAddress || !depositAddress}
                  className="w-10 h-10 shrink-0 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="w-full mt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs text-black/50 dark:text-white/50 font-medium">Network</span>
                  <span className="text-xs font-bold text-black/90 dark:text-white/90">{selectedNetwork}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs text-black/50 dark:text-white/50 font-medium">Minimum Deposit</span>
                  <span className="text-xs font-bold text-black/90 dark:text-white/90">0.0001 {selectedCrypto.symbol}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs text-black/50 dark:text-white/50 font-medium">Expected Arrival</span>
                  <span className="text-xs font-bold text-black/90 dark:text-white/90">15 network confirmations</span>
                </div>
              </div>

              <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-[20px] p-4 text-center">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  Send only {selectedCrypto.symbol} to this deposit address through the {selectedNetwork} network. Sending any other coin or token may result in the loss of your deposit.
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
