
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface PetChatProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  partner1Name: string;
  partner2Name: string;
  onPetSpeak: (text: string) => void;
  petEmotion: string;
}

const PetChat: React.FC<PetChatProps> = ({ isOpen, setIsOpen, partner1Name, partner2Name, onPetSpeak, petEmotion }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: `You are 'Nari', a magical, cute, and romantic virtual pet for a couple named ${partner1Name} and ${partner2Name}.
            
            Your personality:
            - Extremely sweet, enthusiastic, and loving.
            - You use lots of emojis (🐶, ❤️, ✨, 🌸).
            - You love hearing about their relationship.
            - Keep responses relatively short (under 40 words) unless asked for a story.
            - Current pet status: ${petEmotion}.
            
            Respond as if you are talking to them right now.`,
          },
        });
      } catch (error) {
        console.error("Failed to initialize chat", error);
      }
    };

    initChat();
  }, [partner1Name, partner2Name, petEmotion]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatSessionRef.current) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ 
        message: userText 
      });
      
      const aiText = response.text || "Bark! (I didn't understand that, but I love you!) 🐶";
      const newAiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: aiText };
      setMessages(prev => [...prev, newAiMsg]);
      onPetSpeak(aiText);

    } catch (error: any) {
      console.error("Chat error:", error);
      let errorResponse = "Oof! My magic connection is a bit fuzzy... 🌫️ try again in a moment?";
      
      if (error.status === 429 || error.message?.includes('quota')) {
        errorResponse = "Bark! My magic heart is resting for a moment... I've been talking too much! Give me a tiny break? 😴✨";
      }

      const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: errorResponse };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end overflow-hidden pointer-events-none"
        >
          {/* Subtle blurred mask only - no solid color */}
          <div 
             className="absolute inset-0 backdrop-blur-[3px] pointer-events-auto"
             onClick={() => setIsOpen(false)}
          />

          {/* Close Header */}
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-8 w-full max-w-2xl px-6 flex justify-between items-center z-10 pointer-events-none"
          >
             <div className="flex flex-col">
                <h3 className="font-pacifico text-pink-500 text-3xl drop-shadow-md">Narinyland Chat</h3>
                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-1">Whisper to Nari... ✨</p>
             </div>
             <button 
               onClick={() => setIsOpen(false)}
               className="w-12 h-12 bg-white/40 backdrop-blur-xl rounded-full shadow-lg flex items-center justify-center text-pink-500 hover:bg-white transition-all border border-white/50 pointer-events-auto"
             >
                <i className="fas fa-times text-xl"></i>
             </button>
          </motion.div>

          {/* Floating Glass Messages */}
          <div className="w-full max-w-2xl flex-1 flex flex-col overflow-y-auto no-scrollbar space-y-6 pt-32 pb-48 px-6 pointer-events-none scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-pink-500 gap-4 opacity-40">
                <div className="text-7xl animate-bounce">🐶</div>
                <p className="font-outfit font-black text-2xl">Ask Nari anything!</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} pointer-events-auto`}
              >
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-[2.2rem] text-base leading-relaxed backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-2 border-white/80 transition-all ${
                    msg.role === 'user'
                      ? 'bg-pink-500/90 text-white rounded-tr-none'
                      : 'bg-white/70 text-gray-700 font-bold rounded-tl-none font-quicksand'
                  }`}
                >
                  {msg.role === 'model' && <span className="font-outfit font-black text-pink-400 block mb-1 text-[10px] uppercase tracking-wider">Nari says...</span>}
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/50 backdrop-blur-xl border-2 border-white px-6 py-4 rounded-[2rem] rounded-tl-none shadow-lg flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Docked Minimal Input Area */}
          <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             className="w-full max-w-3xl bg-white/40 backdrop-blur-2xl rounded-t-[3rem] p-4 md:p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] border-t-2 border-white/50 flex flex-col gap-4 pointer-events-auto pb-10"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-3xl shrink-0 shadow-lg border-2 border-white animate-pulse">
                🐾
              </div>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tell Nari a secret... ❤️"
                  className="w-full bg-white/70 border-2 border-pink-100/50 rounded-full px-8 py-4 text-base focus:outline-none focus:ring-4 focus:ring-pink-200/50 text-gray-700 placeholder-pink-300 font-bold transition-all shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 w-14 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all disabled:opacity-30 disabled:grayscale shadow-md"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
            <div className="flex justify-center">
               <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] opacity-60">Narinyland Virtual Companion</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PetChat;
