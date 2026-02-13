
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  color: string;
  expiry?: string;
  for?: string; // 'partner1' or 'partner2'
}

interface Partners {
  partner1: { name: string; avatar: string };
  partner2: { name: string; avatar: string };
}

interface LoveCouponsProps {
  coupons: Coupon[];
  partners?: Partners;
}

const LoveCoupons: React.FC<LoveCouponsProps> = ({ coupons, partners }) => {
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'partner1' | 'partner2'>('partner1');

  const toggleCoupon = (id: string) => {
    if (redeemed.includes(id)) {
      setRedeemed(prev => prev.filter(c => c !== id));
    } else {
      setRedeemed(prev => [...prev, id]);
    }
  };

  // Filter coupons based on active tab
  // If no 'for' property is set, show on both or maybe default to partner1? 
  // Let's assume default to active tab if undefined, or strictly filter.
  const filteredCoupons = coupons.filter(c => {
    if (!c.for) return true; // Show legacy coupons everywhere
    return c.for === activeTab;
  });

  const p1Name = partners?.partner1.name || 'Her';
  const p2Name = partners?.partner2.name || 'Him';

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="font-pacifico text-3xl text-pink-500 mb-2">Love Coupons</h2>
        <p className="text-gray-500 font-quicksand">Select a recipient to view their gifts! ❤️</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8 bg-white/50 p-1 rounded-full max-w-xs mx-auto backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('partner1')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${
            activeTab === 'partner1' 
              ? 'bg-pink-500 text-white shadow-md' 
              : 'text-gray-500 hover:text-pink-400'
          }`}
        >
          {partners?.partner1.avatar} For {p1Name}
        </button>
        <button
          onClick={() => setActiveTab('partner2')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${
            activeTab === 'partner2' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-500 hover:text-blue-400'
          }`}
        >
           {partners?.partner2.avatar} For {p2Name}
        </button>
      </div>

      <div className="min-h-[300px]">
        {filteredCoupons.length === 0 ? (
           <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl">
             No coupons available for {activeTab === 'partner1' ? p1Name : p2Name} yet! 🥺
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCoupons.map((coupon) => {
                const isRedeemed = redeemed.includes(coupon.id);

                return (
                  <motion.div
                    key={coupon.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.03, rotate: isRedeemed ? 0 : [0, 1, -1, 0] }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleCoupon(coupon.id)}
                    className={`relative cursor-pointer group select-none`}
                  >
                    {/* Ticket Container */}
                    <div className={`
                      relative flex h-32 w-full overflow-hidden rounded-xl shadow-md border-2 
                      transition-all duration-300
                      ${isRedeemed ? 'border-gray-300 opacity-60 grayscale-[0.8]' : 'border-white'}
                    `}>
                      
                      {/* Left Stub (Emoji) */}
                      <div className={`
                        w-24 flex items-center justify-center text-4xl bg-gradient-to-br border-r-2 border-dashed border-white/50 relative
                        ${coupon.color}
                      `}>
                        {/* Perforation Circles */}
                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#fce7f3] rounded-full"></div>
                        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#fce7f3] rounded-full"></div>
                        
                        <span className="drop-shadow-sm">{coupon.emoji}</span>
                      </div>

                      {/* Right Content */}
                      <div className={`flex-1 flex flex-col justify-center px-6 bg-white`}>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{coupon.title}</h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-1">{coupon.desc}</p>
                        {coupon.expiry && (
                          <p className="text-[10px] text-red-400 font-bold">Expires: {coupon.expiry}</p>
                        )}
                      </div>
                    </div>

                    {/* Redeemed Stamp Overlay */}
                    <AnimatePresence>
                      {isRedeemed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                          animate={{ opacity: 1, scale: 1, rotate: -15 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        >
                          <div className="border-[5px] border-red-500/80 text-red-500/80 font-black text-3xl uppercase tracking-widest px-6 py-2 rounded-xl backdrop-blur-sm shadow-lg transform -rotate-6">
                            Redeemed
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoveCoupons;
