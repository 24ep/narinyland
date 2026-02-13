
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timeline from './components/Timeline';
import MemoryFrame from './components/MemoryFrame';
import ProposalScreen from './components/ProposalScreen';
import LoveCoupons from './components/LoveCoupons';
import LoveLetter from './components/LoveLetter';
import LoveTree from './components/LoveTree';
import EditDrawer from './components/EditDrawer';
import Logo from './components/Logo';
import PetChat from './components/PetChat'; 
import LoveQuest from './components/LoveQuest';
import CupidPoet from './components/CupidPoet';
import DateNightPlanner from './components/DateNightPlanner';
import { Interaction, Emotion, LoveLetterMessage, LoveStats, MemoryItem } from './types';
import { GeminiLiveService, decode, decodeAudioData } from './services/geminiLive';

const INITIAL_MEMORIES: MemoryItem[] = [
  { url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop", privacy: 'public' },
  { url: "https://images.unsplash.com/photo-1516589174184-c6848463ea2a?q=80&w=800&auto=format&fit=crop", privacy: 'private' },
  { url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=800&auto=format&fit=crop", privacy: 'public' },
  { url: "https://images.unsplash.com/photo-1522673607200-164451ee758e?q=80&w=800&auto=format&fit=crop", privacy: 'private' },
  { url: "https://images.unsplash.com/photo-1621600411688-4be93cd68504?q=80&w=800&auto=format&fit=crop", privacy: 'public' }
];

const INITIAL_TIMELINE: Interaction[] = [
  { 
    id: '1', 
    text: "The day our worlds collided. I knew there was something special about you from the very first moment. ✨", 
    type: 'system', 
    timestamp: new Date('2023-01-01T10:00:00') 
  },
  { 
    id: '2', 
    text: "Our first date! I was so nervous but your smile made everything perfect. 🌹", 
    type: 'pet', 
    timestamp: new Date('2023-02-14T19:00:00')
  }
];

const INITIAL_COUPONS = [
  { id: '1', title: 'Romantic Dinner', emoji: '🍝', desc: 'My treat, your choice of restaurant.', color: 'from-orange-100 to-amber-100', for: 'partner1' },
  { id: '2', title: 'Back Massage', emoji: '💆‍♀️', desc: '30 minutes of relaxation, anytime.', color: 'from-blue-100 to-cyan-100', for: 'partner2' },
];

const App: React.FC = () => {
  const [hasAcceptedProposal, setHasAcceptedProposal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false); 
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isPetChatOpen, setIsPetChatOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [petEmotion, setPetEmotion] = useState<Emotion>('neutral');
  const [petMessage, setPetMessage] = useState("Hello! Welcome to Narinyland! 🐾");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loveStats, setLoveStats] = useState<LoveStats>({ xp: 0, level: 1, questsCompleted: 0 });
  const [loveLetters, setLoveLetters] = useState<LoveLetterMessage[]>([]);

  const liveService = useRef<GeminiLiveService | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTime = useRef<number>(0);

  const [appConfig, setAppConfig] = useState({
    appName: "Narinyland",
    anniversaryDate: "2023-01-01T00:00:00.000Z",
    treeStyle: "sakura",
    galleryStyle: "carousel",
    gallerySource: "manual" as "manual" | "instagram",
    instagramUsername: "",
    daysPerTree: 100,
    proposal: {
      q1: "Will you be my Valentine?",
      q2: "Jaroonwit is so handsome, right?"
    },
    gallery: INITIAL_MEMORIES,
    timeline: INITIAL_TIMELINE,
    partners: {
      partner1: { name: 'Her', avatar: '👩' },
      partner2: { name: 'Him', avatar: '👨' }
    },
    coupons: INITIAL_COUPONS
  });

  const [galleryViewMode, setGalleryViewMode] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    if (!hasAcceptedProposal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'hidden';
    }
  }, [hasAcceptedProposal]);

  const addXP = (amount: number) => {
    setLoveStats(prev => {
      const newXP = prev.xp + amount;
      const nextLevelXP = prev.level * 100;
      if (newXP >= nextLevelXP && prev.level < 10) { 
        const nextLevel = prev.level + 1;
        let message = `LEVEL UP! Nari evolved to Level ${nextLevel}! 🎉✨`;
        if (nextLevel === 2) message = "Nari is feeling royal! Level 2 Unlocked 👑";
        if (nextLevel === 3) message = "Magic flows through Nari! Level 3 Reached ✨";
        if (nextLevel === 4) message = "Nari has taken flight! Level 4 Angel Form 👼";
        if (nextLevel === 5) message = "Behold! Ascended Nari! Level 5 reached 🌟";
        
        setPetMessage(message);
        setPetEmotion('excited');
        return { ...prev, xp: newXP - nextLevelXP, level: nextLevel };
      }
      return { ...prev, xp: newXP };
    });
  };

  const handleQuestComplete = (questText: string) => {
    addXP(50);
    setLoveStats(prev => ({ ...prev, questsCompleted: prev.questsCompleted + 1 }));
    setPetEmotion('excited');
    setPetMessage("Amazing job! You're making Narinyland shine! 💖");
    
    const timelineEvent: Interaction = {
      id: `quest_${Date.now()}`,
      text: `🏆 Quest Complete: ${questText}`,
      timestamp: new Date(),
      type: 'quest'
    };

    setAppConfig(prev => ({
      ...prev,
      timeline: [timelineEvent, ...prev.timeline]
    }));
  };

  const handleProposalAccepted = () => {
    setHasAcceptedProposal(true);
    if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    connectLiveService();
  };

  const connectLiveService = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    setPetEmotion('thinking');
    setPetMessage("Nari is waking up... ⏳");

    if (!liveService.current) {
      liveService.current = new GeminiLiveService();
    }

    try {
      await liveService.current.connect({
        onMessage: (text) => setPetMessage(text),
        onAudioData: async (base64) => {
          if (!audioContext.current) return;
          try {
             const audioBuffer = await decodeAudioData(decode(base64), audioContext.current, 24000, 1);
             const source = audioContext.current.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(audioContext.current.destination);
             const currentTime = audioContext.current.currentTime;
             if (nextStartTime.current < currentTime) nextStartTime.current = currentTime;
             source.start(nextStartTime.current);
             nextStartTime.current += audioBuffer.duration;
             audioQueue.current.push(source);
             setPetEmotion('happy');
             setTimeout(() => setPetEmotion('neutral'), audioBuffer.duration * 1000);
          } catch (e) { console.error(e); }
        },
        onInterrupted: () => {
          audioQueue.current.forEach(source => source.stop());
          audioQueue.current = [];
          nextStartTime.current = 0;
          setPetEmotion('neutral');
        },
        onError: (e) => {
          console.error("Nari Encountered an Error:", e);
          setPetEmotion('sleeping');
          setConnectionError(e.message || "Connection failed");
        }
      });
      setPetEmotion('neutral');
      setPetMessage("Nari is here! Ask me anything! ✨");
    } catch (e: any) { 
      console.error("Nari Connection Failed:", e);
      setPetEmotion('sleeping');
      setConnectionError(e.message || "Deadline expired or connection lost.");
      setPetMessage("Zzz... Nari is tired. Wake her up? 😴");
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        setIsCameraActive(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      } catch (err) { setIsCameraActive(false); }
    }
  };

  const handleSendMessage = (msg: LoveLetterMessage) => {
    setLoveLetters(prev => [msg, ...prev]);
    addXP(20);
    const senderName = msg.fromId === 'partner1' ? appConfig.partners.partner1.name : appConfig.partners.partner2.name;
    const timelineEvent: Interaction = {
      id: `letter_${msg.id}`,
      text: `💌 Letter from ${senderName}: ${msg.content.substring(0, 60)}...`,
      timestamp: new Date(msg.unlockDate),
      type: 'letter'
    };
    setAppConfig(prev => ({ ...prev, timeline: [timelineEvent, ...prev.timeline] }));
  };

  const handleUpdateTimeline = (updated: Interaction) => {
    setAppConfig(prev => ({
      ...prev,
      timeline: prev.timeline.map(t => t.id === updated.id ? { ...updated, timestamp: new Date(updated.timestamp) } : t)
    }));
  };

  const handleAddTimeline = (interaction: Interaction) => {
    setAppConfig(prev => ({
      ...prev,
      timeline: [{ ...interaction, timestamp: new Date(interaction.timestamp) }, ...prev.timeline]
    }));
  };

  const handleDeleteTimeline = (id: string) => {
    setAppConfig(prev => ({
      ...prev,
      timeline: prev.timeline.filter(t => t.id !== id)
    }));
  };

  // Improved symmetric heart shape clip path
  const heartClipPath = "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')";

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 relative overflow-x-hidden">
      
      <AnimatePresence>
        {!hasAcceptedProposal && (
          <ProposalScreen onAccept={handleProposalAccepted} questions={appConfig.proposal} appName={appConfig.appName} />
        )}
      </AnimatePresence>

      {hasAcceptedProposal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl flex flex-col items-center z-10">
          <div className="fixed top-4 right-4 flex gap-2 z-50">
            <button onClick={() => setIsEditDrawerOpen(true)} className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-white transition-all"><i className="fas fa-cog"></i></button>
          </div>

          <Logo size={180} title={appConfig.appName} className="mt-8 mb-4" />

          {/* Enhanced XP Progress Display */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mb-10 px-6 z-20"
          >
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 shadow-sm border-2 border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
              {/* Level Badge */}
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white shrink-0 relative group">
                <span className="font-pacifico text-white text-xl drop-shadow-sm pt-1">{loveStats.level}</span>
                <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">Lvl</div>
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </div>
              
              {/* Progress Info */}
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                 <div className="flex justify-between items-end text-pink-600">
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Growth</span>
                    <span className="text-[10px] font-black opacity-60 bg-white/50 px-2 rounded-full">{loveStats.xp} / {loveStats.level * 100} XP</span>
                 </div>
                 <div className="w-full h-3 bg-pink-50 rounded-full overflow-hidden border border-pink-100 relative shadow-inner">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fbcfe8 5px, #fbcfe8 10px)' }}></div>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (loveStats.xp / (loveStats.level * 100)) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 40, damping: 15 }}
                      className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-yellow-400 relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/40 blur-[2px]"></div>
                    </motion.div>
                 </div>
              </div>
            </div>
          </motion.div>

          <div className="relative w-full mb-12 flex flex-col items-center justify-center">
             
             {/* Love Forest & Pet Container */}
             <div className="w-full relative">
                <LoveTree 
                  anniversaryDate={appConfig.anniversaryDate} 
                  treeStyle={appConfig.treeStyle} 
                  petEmotion={petEmotion}
                  petMessage={petMessage}
                  level={loveStats.level}
                  daysPerTree={appConfig.daysPerTree}
                  onPetClick={() => setIsPetChatOpen(true)}
                />

                {/* Daily Quest Positioned Floating in the Forest */}
                <div className="absolute right-[-10px] md:right-0 top-10 z-40 transform scale-90 md:scale-100">
                    <LoveQuest 
                      partner1={appConfig.partners.partner1.name} 
                      partner2={appConfig.partners.partner2.name} 
                      onComplete={handleQuestComplete}
                    />
                </div>

                {/* Connection Status / Retry */}
                <AnimatePresence>
                  {petEmotion === 'sleeping' && !isConnecting && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                      <button 
                        onClick={connectLiveService}
                        className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border-4 border-pink-200 text-pink-600 font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-pink-500 hover:text-white transition-all animate-bounce"
                      >
                        <i className="fas fa-bolt"></i> Wake Up Nari!
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isConnecting && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 text-pink-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse z-40">
                    Nari is coming...
                  </div>
                )}
             </div>
             
             {/* Heart Shaped Mirrors */}
             <AnimatePresence>
               {isCameraActive && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute -bottom-20 w-full flex justify-between px-4 md:px-12 z-40 items-end">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="w-40 h-40 md:w-56 md:h-56 bg-white p-1.5 shadow-2xl relative"
                      style={{ clipPath: heartClipPath }}
                    >
                       <div className="w-full h-full bg-gradient-to-br from-pink-300 via-rose-400 to-red-500 flex items-center justify-center overflow-hidden">
                          <span className="text-8xl animate-pulse drop-shadow-lg">{appConfig.partners.partner1.avatar}</span>
                       </div>
                    </motion.div>
                    
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                      className="w-40 h-40 md:w-56 md:h-56 bg-white p-1.5 shadow-2xl relative"
                      style={{ clipPath: heartClipPath }}
                    >
                       <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                       </div>
                    </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Mirror Toggle Button */}
             <div className={`mt-10 transition-all duration-300 relative z-50`}>
               <button onClick={toggleCamera} className={`px-10 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 transition-all ${isCameraActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-pink-500 hover:bg-pink-50 border-2 border-pink-100 hover:scale-105'}`}>
                 <i className={`fas ${isCameraActive ? 'fa-video-slash' : 'fa-video'}`}></i>
                 {isCameraActive ? 'Close Mirror' : 'Open Love Mirror'}
               </button>
             </div>
          </div>

          <div className="h-16"></div>
          
          <MemoryFrame 
            isVisible={true} 
            items={appConfig.gallery} 
            style={appConfig.galleryStyle} 
            source={appConfig.gallerySource}
            username={appConfig.instagramUsername}
            viewMode={galleryViewMode}
            onViewModeChange={setGalleryViewMode}
          />
          
          <div className="h-24"></div>

          {/* Timeline Section */}
          <Timeline 
            interactions={appConfig.timeline} 
            anniversaryDate={appConfig.anniversaryDate} 
            onUpdateInteraction={handleUpdateTimeline}
            onDeleteInteraction={handleDeleteTimeline}
            onAddInteraction={handleAddTimeline}
          />
          
          <div className="h-24"></div>

          {/* Plan and Create Dashboard */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-20">
            <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] p-4 border-4 border-white shadow-xl">
              <CupidPoet />
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-[3rem] p-4 border-4 border-white shadow-xl">
              <DateNightPlanner />
            </div>
          </div>

          <LoveCoupons coupons={appConfig.coupons} partners={appConfig.partners} />

          {/* Mailbox Button */}
          <motion.div className="fixed bottom-6 right-6 z-[60]" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <button onClick={() => setIsLetterOpen(true)} className="bg-white p-5 rounded-full shadow-2xl text-4xl border-2 border-pink-50 flex items-center justify-center hover:bg-pink-50 transition-colors">
              <span className="relative">
                💌
                {loveLetters.length > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                     {loveLetters.length}
                   </span>
                )}
              </span>
            </button>
          </motion.div>

          <PetChat 
            isOpen={isPetChatOpen}
            setIsOpen={setIsPetChatOpen}
            partner1Name={appConfig.partners.partner1.name} 
            partner2Name={appConfig.partners.partner2.name} 
            onPetSpeak={(text) => setPetMessage(text)}
            petEmotion={petEmotion}
          />

          <LoveLetter 
            isOpen={isLetterOpen} 
            onClose={() => setIsLetterOpen(false)} 
            messages={loveLetters}
            onSendMessage={handleSendMessage}
            partners={appConfig.partners}
          />

          <EditDrawer 
            isOpen={isEditDrawerOpen} 
            onClose={() => setIsEditDrawerOpen(false)} 
            config={appConfig} 
            setConfig={setAppConfig} 
          />
        </motion.div>
      )}
    </div>
  );
};

export default App;
