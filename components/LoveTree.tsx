
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetVisual from './PetVisual';
import { Emotion } from '../types';

interface LoveTreeProps {
  anniversaryDate: string;
  treeStyle?: string;
  petEmotion: Emotion;
  petMessage: string;
  level: number;
  daysPerTree: number;
  onPetClick?: () => void;
}

const THEMES: Record<string, any> = {
  oak: {
    name: 'Classic Oak',
    trunk: '#8B4513',
    trunkStroke: '#5D4037',
    leaves: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
    bg: 'from-transparent to-green-50/30',
    titleColor: 'text-green-600',
    particle: '♥',
  },
  sakura: {
    name: 'Sakura',
    trunk: '#5D4037',
    trunkStroke: '#3E2723',
    leaves: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899'],
    bg: 'from-transparent to-pink-100/40',
    titleColor: 'text-pink-500',
    particle: '🌸',
  },
  neon: {
    name: 'Neon',
    trunk: '#4c1d95',
    trunkStroke: '#2e1065',
    leaves: ['#22d3ee', '#818cf8', '#c084fc', '#e879f9'],
    bg: 'from-slate-900/80 to-purple-900/80',
    titleColor: 'text-cyan-400',
    particle: '✨',
  },
  frozen: {
    name: 'Frozen',
    trunk: '#475569',
    trunkStroke: '#334155',
    leaves: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
    bg: 'from-transparent to-blue-50/50',
    titleColor: 'text-blue-400',
    particle: '❄️',
  },
  golden: {
    name: 'Golden Hour',
    trunk: '#78350f',
    trunkStroke: '#451a03',
    leaves: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706'],
    bg: 'from-orange-50/50 to-amber-100/40',
    titleColor: 'text-amber-600',
    particle: '☀️',
  }
};

const LoveTree: React.FC<LoveTreeProps> = ({ anniversaryDate, treeStyle = 'oak', petEmotion, petMessage, level, daysPerTree, onPetClick }) => {
  const [leaves, setLeaves] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  
  const theme = THEMES[treeStyle] || THEMES['oak'];

  const { totalDays, treeCount } = useMemo(() => {
    const start = new Date(anniversaryDate);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const treeCount = Math.floor(totalDays / daysPerTree);
    return { totalDays, treeCount };
  }, [anniversaryDate, daysPerTree]);

  const addLeaf = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y > 320) return; 
    const randomColor = theme.leaves[Math.floor(Math.random() * theme.leaves.length)];
    const newLeaf = { id: Date.now(), x, y, color: randomColor };
    setLeaves((prev) => [...prev, newLeaf]);
  };

  const forestTrees = useMemo(() => {
    return Array.from({ length: treeCount }).map((_, i) => ({
      id: i,
      scale: 0.3 + Math.random() * 0.3,
      left: (i % 2 === 0 ? 5 + (Math.random() * 25) : 70 + (Math.random() * 25)),
      bottom: Math.random() * 15,
      delay: i * 0.15,
      color: theme.leaves[i % theme.leaves.length]
    }));
  }, [treeCount, theme]);

  return (
    <div className={`w-full py-20 px-6 flex flex-col items-center bg-gradient-to-b ${theme.bg} rounded-[3rem] mt-10 relative overflow-hidden transition-colors duration-1000`}>
      
      <div className="text-center mb-12 relative z-30 pointer-events-none">
        <h2 className={`font-pacifico text-4xl ${theme.titleColor} mb-2 drop-shadow-sm`}>Our Love Forest 🌳</h2>
        <p className={`${treeStyle === 'neon' ? 'text-gray-300' : 'text-gray-500'} font-quicksand font-bold`}>Growing stronger for {totalDays} days.</p>
        <p className={`text-[10px] font-black uppercase tracking-widest ${treeStyle === 'neon' ? 'text-cyan-300' : 'text-pink-400'} mt-2`}>
          {treeCount > 0 
            ? `${treeCount} ancient trees representing our journey` 
            : "Reach some days to grow your first tree!"}
        </p>
      </div>

      <div className="relative w-full max-w-2xl h-[600px] flex items-end justify-center">
        
        {/* FOREST BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <AnimatePresence>
            {forestTrees.map((tree) => (
               <motion.div
                 key={`forest-${tree.id}`}
                 initial={{ scale: 0, opacity: 0, y: 50 }}
                 whileInView={{ scale: tree.scale, opacity: 0.8, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ type: "spring", stiffness: 100, damping: 15, delay: tree.delay }}
                 className="absolute bottom-0 opacity-80"
                 style={{ left: `${tree.left}%`, bottom: `${tree.bottom}%`, filter: 'blur(0.5px)' }}
               >
                  <svg width="150" height="200" viewBox="0 0 100 150">
                    <path d="M50 150 L50 120" stroke={theme.trunk} strokeWidth="6" />
                    <motion.path 
                      d="M50 120 Q20 100 20 70 Q50 30 80 70 Q80 100 50 120" 
                      fill={tree.color} 
                      animate={{ d: ["M50 120 Q20 100 20 70 Q50 30 80 70 Q80 100 50 120", "M50 118 Q18 102 18 72 Q52 32 82 72 Q82 102 50 118", "M50 120 Q20 100 20 70 Q50 30 80 70 Q80 100 50 120"] }}
                      transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
               </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* PET PLAYING AROUND THE TREE - Interaction Enabled */}
        <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
           <PetVisual 
             emotion={petEmotion} 
             message={petMessage} 
             level={level} 
             className="transform -translate-y-12 pointer-events-auto"
             onPetClick={onPetClick}
           />
        </div>

        {/* MAIN INTERACTIVE TREE */}
        <motion.div 
          className="relative w-[400px] h-[600px] cursor-pointer z-20 group" 
          onClick={addLeaf}
          animate={{
            filter: petEmotion === 'playing' ? ['brightness(1)', 'brightness(1.1)', 'brightness(1)'] : 'brightness(1)'
          }}
          transition={{ duration: 0.5, repeat: petEmotion === 'playing' ? Infinity : 0 }}
        >
          <svg viewBox="0 0 340 450" className="absolute bottom-0 left-0 w-full h-full pointer-events-none transition-all duration-1000 overflow-visible">
             <defs>
               <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
             </defs>
            
             <path d="M130 450 Q170 420 170 380 Q170 420 210 450" stroke={theme.trunk} strokeWidth="24" fill="none" strokeLinecap="round"/>
             <path d="M170 400 L170 300 Q170 200 120 150 M170 300 Q170 200 220 150" stroke={theme.trunk} strokeWidth="28" fill="none" strokeLinecap="round" filter={treeStyle === 'neon' ? 'url(#glow)' : ''}/>
             <path d="M170 280 Q140 240 100 220 M170 280 Q200 240 240 220" stroke={theme.trunk} strokeWidth="18" fill="none" strokeLinecap="round"/>
             <path d="M120 150 Q100 100 60 80 M220 150 Q240 100 280 80" stroke={theme.trunk} strokeWidth="14" fill="none" strokeLinecap="round"/>
             <path d="M170 300 L170 180 Q170 100 170 60" stroke={theme.trunk} strokeWidth="16" fill="none" strokeLinecap="round"/>

             <g className="opacity-80">
                <circle cx="60" cy="80" r="40" fill={theme.leaves[0]} className="opacity-60" />
                <circle cx="280" cy="80" r="40" fill={theme.leaves[1]} className="opacity-60" />
                <circle cx="170" cy="60" r="50" fill={theme.leaves[2]} className="opacity-60" />
                <circle cx="120" cy="150" r="30" fill={theme.leaves[3]} className="opacity-40" />
                <circle cx="220" cy="150" r="30" fill={theme.leaves[0]} className="opacity-40" />
             </g>
          </svg>

          <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
            <AnimatePresence>
              {leaves.map((leaf) => (
                <motion.div
                  key={leaf.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute text-xl select-none"
                  style={{ 
                    left: leaf.x - 10, 
                    top: leaf.y - 10, 
                    color: leaf.color,
                    filter: theme.particle === '✨' ? 'drop-shadow(0 0 5px currentColor)' : 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))'
                  }}
                >
                  {theme.particle}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {[...Array(15)].map((_, i) => (
               <motion.div
                  key={`static-${i}`}
                  animate={{ rotate: [0, 8, -8, 0], y: [0, -8, 0] }}
                  transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: i * 0.4 }}
                  className="absolute text-2xl pointer-events-none transition-colors duration-1000"
                  style={{ 
                    top: 20 + Math.random() * 250, 
                    left: 20 + Math.random() * 300, 
                    color: theme.leaves[i % theme.leaves.length], 
                    filter: treeStyle === 'neon' ? 'drop-shadow(0 0 8px currentColor)' : '' 
                  }}
               >
                  {theme.particle}
               </motion.div>
            ))}
          </div>
          
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-pink-500 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl pointer-events-none border border-pink-100">
            Plant Love Memories 🌸
          </div>
        </motion.div>
      </div>
      
      <p className={`${treeStyle === 'neon' ? 'text-gray-400' : 'text-pink-300'} text-sm mt-8 italic font-bold transition-colors pointer-events-none`}>
        {leaves.length > 0 ? `${leaves.length} new memories blooming today` : "Tap the tree to bloom..."}
      </p>
    </div>
  );
};

export default LoveTree;
