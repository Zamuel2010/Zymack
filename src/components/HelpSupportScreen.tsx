import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MessageCircle, Send, HeadphonesIcon, HelpCircle, FileText, ChevronDown } from 'lucide-react';

export default function HelpSupportScreen({ onBack }: { onBack: () => void }) {
  const [activeChat, setActiveChat] = useState(false);
  const [msg, setMsg] = useState('');
  const [chatMsgs, setChatMsgs] = useState([
      { id: 1, text: 'Hello! I am Zymack Support Bot. How can I assist you today?', sender: 'bot' }
  ]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
      { q: "How do I fund my account?", a: "You can fund your account via bank transfer to the dedicated account number located on the Home screen." },
      { q: "My transaction failed but I was debited", a: "Failed transactions are usually reversed automatically within 24 hours. If you haven't received your refund, please open a chat with our support team." },
      { q: "What is my daily transaction limit?", a: "Tier 1 accounts have a N50,000 daily limit. Upgrade to Tier 2 by providing your BVN/NIN to increase your limit to N5,000,000." },
      { q: "How do I get a virtual card?", a: "Navigate to the Cards tab, ensure you have at least N1,500 in your balance, and click 'Create Card'. The fee will be deducted automatically." }
  ];

  const handleSend = () => {
    if (!msg.trim()) return;
    setChatMsgs([...chatMsgs, { id: Date.now(), text: msg, sender: 'user' }]);
    setMsg('');
    
    // Simulate auto-reply
    setTimeout(() => {
        setChatMsgs(prev => [...prev, { id: Date.now(), text: 'An agent will be with you shortly. Thank you for your patience.', sender: 'bot' }]);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="absolute inset-0 bg-[#F5F5F7] dark:bg-[#050505] z-50 overflow-y-auto"
    >
      <div className="absolute top-0 w-full h-[30vh] bg-blue-500/10 dark:bg-blue-500/5 rounded-b-[40px] pointer-events-none"></div>

      <div className="relative z-10 px-6 pt-10 pb-20 max-w-[480px] mx-auto min-h-screen flex flex-col">
          {!activeChat ? (
              <AnimatePresence mode="wait">
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center mb-8">
                        <button 
                          onClick={onBack}
                          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
                        </button>
                        <h2 className="text-2xl font-black text-black/90 dark:text-white/90 tracking-tight">Help & Support</h2>
                      </div>

                      <div className="bg-white dark:bg-[#111] rounded-[32px] p-6 shadow-sm border border-black/5 dark:border-white/5 mb-8 text-center flex flex-col items-center">
                          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                              <HeadphonesIcon size={32} />
                          </div>
                          <h3 className="text-xl font-black text-black dark:text-white mb-2">We're here to help!</h3>
                          <p className="text-sm font-medium text-black/50 dark:text-white/50 mb-6 px-4">Got an issue with a transaction or need clarification? Reach out to our support team.</p>
                          
                          <button
                             onClick={() => setActiveChat(true)}
                             className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                              <MessageCircle size={20} />
                              Start Live Chat
                          </button>
                      </div>

                      <div>
                          <h3 className="text-sm font-bold text-black/90 dark:text-white/90 mb-4 flex items-center gap-2">
                              <HelpCircle size={16} /> Frequently Asked Questions
                          </h3>
                          <div className="space-y-3">
                              {faqs.map((faq, i) => (
                                  <div key={i} className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden transition-all">
                                      <button 
                                        className="w-full text-left p-4 flex items-center justify-between font-bold text-sm text-black/80 dark:text-white/80"
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                      >
                                          <span className="pr-4 leading-relaxed">{faq.q}</span>
                                          <ChevronDown size={18} className={`shrink-0 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                                      </button>
                                      <AnimatePresence>
                                          {activeFaq === i && (
                                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                  <div className="px-4 pb-4 pt-0 text-sm font-medium text-black/50 dark:text-white/50 leading-relaxed">
                                                      {faq.a}
                                                  </div>
                                              </motion.div>
                                          )}
                                      </AnimatePresence>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </motion.div>
              </AnimatePresence>
          ) : (
              <AnimatePresence mode="wait">
                  <motion.div key="chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-[calc(100vh-100px)]">
                      <div className="flex items-center mb-6 py-4 border-b border-black/5 dark:border-white/5">
                        <button 
                          onClick={() => setActiveChat(false)}
                          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mr-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                               <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                   <HeadphonesIcon size={20} />
                               </div>
                               <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#050505] rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="text-base font-black text-black/90 dark:text-white/90 tracking-tight leading-tight">Live Support</h2>
                                <p className="text-xs font-bold text-emerald-500">Agent Online</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto pb-4 space-y-4">
                          {chatMsgs.map(m => (
                              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium leading-relaxed ${
                                      m.sender === 'user' 
                                      ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm' 
                                      : 'bg-black/5 dark:bg-white/5 text-black dark:text-white rounded-tl-sm'
                                  }`}>
                                      {m.text}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="relative mt-auto">
                          <input 
                              type="text" 
                              placeholder="Type a message..."
                              value={msg}
                              onChange={e => setMsg(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSend()}
                              className="w-full bg-black/5 dark:bg-white/5 rounded-full pl-6 pr-14 py-4 text-sm font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 outline-none border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all"
                          />
                          <button 
                             onClick={handleSend}
                             disabled={!msg.trim()}
                             className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                          >
                             <Send size={18} className="translate-x-[1px]" />
                          </button>
                      </div>
                  </motion.div>
              </AnimatePresence>
          )}
      </div>
    </motion.div>
  );
}
