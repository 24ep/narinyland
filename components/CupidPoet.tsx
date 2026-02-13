
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

const MOODS = [
  { id: 'sweet', label: 'Sweet', emoji: '🍭', prompt: 'sweet, tender, and heartwarming' },
  { id: 'funny', label: 'Funny', emoji: '🤪', prompt: 'funny, witty, and playful' },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', prompt: 'flirty, exciting, and passionate' },
  { id: 'future', label: 'Future', emoji: '🔮', prompt: 'inspiring, about growing old together' },
];

const FALLBACK_POEMS: Record<string, string[]> = {
  sweet: [
    "In Narinyland where flowers bloom,\nYour smile lights up every room.\nA love so deep, a heart so true,\nMy favorite place is being with you. ❤️",
    "Hand in hand we walk this way,\nBrighter than the sun in May.\nWith every breath and every start,\nYou hold the key to all my heart. 🌸"
  ],
  funny: [
    "I love you more than pizza pie,\nThough that's a lie, I won't deny.\nBut since you're cute and smell so sweet,\nI'll share my crust and every treat! 🍕",
    "You're the avocado to my toast,\nThe partner I adore the most.\nEven when you steal the blanket at night,\nYou're still my favorite source of light! 🛏️"
  ],
  spicy: [
    "A look from you, a spark takes flight,\nYou make my world feel oh so bright.\nOne simple touch, one knowing glance,\nI'm caught forever in your dance. 🔥",
    "Forbidden fruits and whispered dreams,\nYou're even more than what it seems.\nCaught in the rhythm of our own beat,\nYou make my life feel quite complete. 😉"
  ],
  future: [
    "When hair turns grey and years go by,\nI'll still have that sparkle in my eye.\nOld and wrinkled, slow and sweet,\nYou're the one who makes me whole and complete. 👵👴",
    "A thousand moons will rise and fall,\nAnd I will love you through it all.\nGrowing old is a dream come true,\nAs long as every day is spent with you. 🔮"
  ]
};

const CupidPoet: React.FC = () => {
  const [poem, setPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const generatePoem = async (moodId: string, moodPrompt: string) => {
    setIsLoading(true);
    setSelectedMood(moodId);
    setPoem(null);
    setIsLocalMode(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short, rhyming 4-line poem about a loving couple in their magical world called 'Narinyland'. 
        The mood should be ${moodPrompt}. 
        Keep it cute, romantic, and include 1-2 emojis at the end. 
        Do not add a title.`,
      });

      if (response.text) {
        setPoem(response.text.trim());
      } else {
        throw new Error("No poem text");
      }
    } catch (error: any) {
      console.warn("Cupid shifted to Local Mode:", error);
      const options = FALLBACK_POEMS[moodId] || FALLBACK_POEMS.sweet;
      const randomPoem = options[Math.floor(Math.random() * options.length)];
      setPoem(randomPoem);
      setIsLocalMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center">
      <div className="text-center mb-8">
        <h2 className="font-pacifico text-3xl text-pink-500 mb-2">Cupid's AI Poet 💘</h2>
        <p className="text-gray-500 font-quicksand">Choose a vibe and let Nari write a poem for us!</p>
        {isLocalMode && (
          <p className="text-[10px] text-pink-300 font-black uppercase tracking-widest mt-1">Local Library Mode</p>
        )}
      </div>

      {/* Mood Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generatePoem(mood.id, mood.prompt)}
            disabled={isLoading}
            className={`
              px-6 py-3 rounded-full font-bold shadow-sm border-2 transition-all flex items-center gap-2
              ${selectedMood === mood.id 
                ? 'bg-pink-500 text-white border-pink-500' 
                : 'bg-white text-gray-600 border-pink-100 hover:border-pink-300'
              }
            `}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span>{mood.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Poem Display Card */}
      <div className="relative w-full min-h-[220px] perspective-1000">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-pink-200"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl mb-2"
              >
                ✍️
              </motion.div>
              <p className="text-pink-400 font-pacifico animate-pulse">Writing a masterpiece...</p>
            </motion.div>
          ) : poem ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, rotateX: 90, y: 20 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full bg-[#fffbf0] p-8 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#e8dfc8] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-200 via-pink-300 to-red-200 opacity-50"></div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                <p className="font-serif text-xl md:text-2xl text-gray-800 leading-relaxed text-center italic whitespace-pre-line">
                  "{poem}"
                </p>
              </motion.div>

              <div className="mt-6 flex justify-end">
                <span className="font-pacifico text-pink-400 text-sm opacity-80">
                  - {isLocalMode ? 'Cupid\'s Classics' : 'Nari, your AI cupid'}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400"
            >
              <p>Your poem will appear here ✨</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CupidPoet;
