
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Interaction, MediaContent } from '../types';

interface TimelineProps {
  interactions: Interaction[];
  anniversaryDate?: string;
  onAddInteraction?: (interaction: Interaction) => void;
  onUpdateInteraction?: (interaction: Interaction) => void;
  onDeleteInteraction?: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  interactions, 
  anniversaryDate,
  onAddInteraction, 
  onUpdateInteraction, 
  onDeleteInteraction 
}) => {
  const [scale, setScale] = useState<1 | 5 | 10>(1);
  const [visibleRowCount, setVisibleRowCount] = useState(5);
  const [activeItem, setActiveItem] = useState<Interaction | null>(null);
  const [isNew, setIsNew] = useState(false);
  
  // Media & Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  };

  const getMonthColor = (date: Date) => {
    const month = date.getMonth();
    const colors = [
      'bg-blue-400', 'bg-blue-300', 'bg-green-400', 'bg-green-500', 
      'bg-yellow-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-400', 
      'bg-purple-400', 'bg-purple-500', 'bg-pink-400', 'bg-pink-300'
    ];
    return colors[month] || 'bg-gray-400';
  };
  
  const allInteractions = useMemo(() => {
    // Normalize existing interactions to ensure timestamps are Date objects
    const combined = interactions.map(i => ({
      ...i,
      timestamp: i.timestamp instanceof Date ? i.timestamp : new Date(i.timestamp)
    }));

    if (anniversaryDate) {
      const start = new Date(anniversaryDate);
      const startYear = start.getFullYear();
      const currentYear = new Date().getFullYear();
      const maxUserYear = combined.length > 0 ? Math.max(...combined.map(i => i.timestamp.getFullYear())) : currentYear;
      
      for (let y = startYear + 1; y <= Math.max(currentYear + 10, maxUserYear + 5); y++) {
        const annivDate = new Date(start);
        annivDate.setFullYear(y);
        combined.push({
          id: `anniv-${y}`,
          text: `${getOrdinal(y - startYear)} Anniversary! 💑`,
          timestamp: annivDate,
          type: 'system',
        });
      }
    }
    // Safe sort using normalized Date objects
    return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [interactions, anniversaryDate]);

  const groupedTimeline = useMemo(() => {
    if (allInteractions.length === 0) return [];
    
    const start = anniversaryDate ? new Date(anniversaryDate) : allInteractions[0].timestamp;
    const firstYear = start.getFullYear();
    const rows = [];
    const lastYear = Math.max(new Date().getFullYear() + 2, ...allInteractions.map(i => i.timestamp.getFullYear()));
    
    const alignedStart = Math.floor(firstYear / scale) * scale;

    for (let y = alignedStart; y <= lastYear; y += scale) {
      rows.push({ 
        startYear: y, 
        endYear: y + scale - 1, 
        items: allInteractions.filter(i => i.timestamp.getFullYear() >= y && i.timestamp.getFullYear() <= y + scale - 1) 
      });
    }
    return rows;
  }, [allInteractions, scale, anniversaryDate]);

  const handleEditClick = (item: Interaction) => {
    if (!item.id.startsWith('anniv-')) {
      setActiveItem({ 
        ...item,
        timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp)
      });
      setIsNew(false);
    }
  };

  const handleAddNew = () => {
    const newItem: Interaction = {
      id: Date.now().toString(),
      text: "",
      timestamp: new Date(),
      type: 'system'
    };
    setActiveItem(newItem);
    setIsNew(true);
  };

  const handleSave = () => {
    if (!activeItem || !activeItem.text.trim()) return;

    if (isNew) {
      onAddInteraction?.(activeItem);
    } else {
      onUpdateInteraction?.(activeItem);
    }
    setActiveItem(null);
  };

  // --- Media Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file && activeItem) {
      const url = URL.createObjectURL(file);
      setActiveItem({ ...activeItem, media: { type, url } });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const url = URL.createObjectURL(blob);
        if (activeItem) {
          setActiveItem({ ...activeItem, media: { type: 'audio', url } });
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeMedia = () => {
    if (activeItem?.media?.url.startsWith('blob:')) {
      URL.revokeObjectURL(activeItem.media.url);
    }
    if (activeItem) {
      setActiveItem({ ...activeItem, media: undefined });
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 px-2 md:px-8">
      {/* Timeline Header Area */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-4">
        <div className="space-y-1">
          <h2 className="font-pacifico text-4xl text-pink-500 drop-shadow-sm">Our Timeline</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Every moment matters ❤️</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleAddNew}
            className="bg-pink-500 text-white px-6 py-2.5 rounded-full shadow-lg shadow-pink-100 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-pink-600 transition-all hover:scale-105"
          >
            <i className="fas fa-plus"></i> Add Milestone
          </button>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-3 hidden sm:inline">Zoom:</span>
            <div className="flex gap-1">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setScale(s as any);
                    setVisibleRowCount(5);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase ${
                    scale === s 
                      ? 'bg-white text-pink-500 shadow-sm' 
                      : 'text-gray-400 hover:text-pink-400'
                  }`}
                >
                  {s}Y
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl space-y-24 relative">
        <AnimatePresence mode="popLayout">
          {groupedTimeline.slice(0, visibleRowCount).map((row) => (
            <motion.div 
              key={`${scale}-${row.startYear}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative pt-12"
            >
              <div className="absolute top-0 left-0 text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] bg-white/95 px-5 py-2 rounded-full shadow-md z-20 border-2 border-pink-100">
                {scale === 1 ? `Year ${row.startYear}` : `${row.startYear} - ${row.endYear}`}
              </div>
              
              <div className="h-2 w-full bg-pink-100/30 rounded-full relative overflow-visible">
                {row.items.map((item) => {
                  const isAnniversary = item.id.startsWith('anniv-');
                  const isQuest = item.type === 'quest';
                  const isLetter = item.type === 'letter';
                  const hasMedia = !!item.media;
                  
                  const rowStartTime = new Date(row.startYear, 0, 1).getTime();
                  const rowEndTime = new Date(row.endYear + 1, 0, 1).getTime();
                  const itemTime = item.timestamp.getTime();
                  const leftPos = ((itemTime - rowStartTime) / (rowEndTime - rowStartTime)) * 100;

                  return (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center group z-10"
                      style={{ left: `${Math.min(Math.max(leftPos, 2), 98)}%` }}
                    >
                      {/* ANNIVERSARY INDICATOR (GOLDEN RING) */}
                      {isAnniversary ? (
                        <div className="relative flex flex-col items-center">
                          <motion.div 
                            whileHover={{ scale: 1.4, rotate: 15 }}
                            className="w-10 h-10 rounded-full border-[3px] border-white bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_0_15px_rgba(251,191,36,0.5)] -mt-6 mb-2 cursor-help flex items-center justify-center relative overflow-hidden group/anniv"
                          >
                            <motion.div 
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-white"
                            />
                            <span className="relative z-10 text-xs">✨</span>
                          </motion.div>

                          {/* Hover Popover Tooltip for Anniversary */}
                          <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all pointer-events-none z-[100] w-max">
                            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border-2 border-yellow-100 text-center">
                              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Milestone Reached</div>
                              <div className="font-pacifico text-gray-800 text-lg leading-tight px-2">{item.text}</div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{item.timestamp.getFullYear()}</div>
                            </div>
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white/95 mx-auto -mt-[58px] rotate-180"></div>
                          </div>
                        </div>
                      ) : (
                        /* REGULAR MILESTONE INDICATOR & CARD */
                        <>
                          <motion.div 
                            whileHover={{ scale: 1.5 }}
                            className={`w-6 h-6 rounded-full border-4 border-white shadow-md -mt-4 mb-2 transition-colors cursor-pointer flex items-center justify-center ${
                              isQuest ? 'bg-green-400' : isLetter ? 'bg-pink-500' : 'bg-red-400'
                            }`}
                            onClick={() => handleEditClick(item)}
                          >
                             {hasMedia && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </motion.div>

                          <div className={`relative bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-xl w-48 text-center border-2 transition-all group-hover:border-pink-300 group-hover:scale-105 group-hover:-translate-y-1 ${
                            isQuest ? 'border-green-200' : 'border-white'
                          }`}>
                            {/* MONTH BADGE */}
                            <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest mb-2 shadow-sm ${getMonthColor(item.timestamp)}`}>
                              {getMonthName(item.timestamp)} {item.timestamp.getDate()}
                            </div>

                            <p className={`text-[12px] font-bold leading-snug mb-1 ${isQuest ? 'text-green-700' : 'text-gray-700'}`}>
                              {item.text}
                            </p>
                            
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter opacity-60">
                              {item.timestamp.getFullYear()}
                            </div>

                            {hasMedia && (
                              <div className="mt-2 flex justify-center gap-1.5 opacity-60">
                                <i className={`fas ${item.media?.type === 'image' ? 'fa-image text-pink-400' : item.media?.type === 'video' ? 'fa-video text-blue-400' : 'fa-microphone text-orange-400'} text-[10px]`}></i>
                              </div>
                            )}

                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button 
                                  onClick={() => handleEditClick(item)}
                                  className="w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg hover:bg-pink-600"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {visibleRowCount < groupedTimeline.length && (
         <button 
           onClick={() => setVisibleRowCount(prev => prev + 5)}
           className="mt-20 bg-white text-pink-500 px-10 py-4 rounded-full shadow-lg font-black text-xs hover:bg-pink-50 transition-all border-2 border-pink-100 uppercase tracking-[0.2em]"
         >
           Explore Further History
         </button>
      )}

      {/* UNIFIED CREATION / EDIT MODAL */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-pink-500 p-6 text-white flex justify-between items-center shrink-0">
                <h3 className="font-pacifico text-2xl">{isNew ? 'New Milestone' : 'Edit Memory'}</h3>
                <button onClick={() => setActiveItem(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">When did this happen?</label>
                   <input 
                     type="datetime-local"
                     value={new Date(activeItem.timestamp.getTime() - activeItem.timestamp.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                     onChange={(e) => setActiveItem({ ...activeItem, timestamp: new Date(e.target.value) })}
                     className="w-full border-2 border-pink-50 rounded-2xl p-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-pink-300 outline-none transition-all bg-gray-50/50"
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Memory Attachment</label>
                   {!activeItem.media ? (
                     <div className="flex gap-2">
                        <label className="flex-1 flex flex-col items-center justify-center py-4 px-2 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all bg-white group">
                          <i className="fas fa-image text-pink-400 text-xl mb-1 group-hover:scale-110 transition-transform"></i>
                          <span className="text-[8px] font-black text-gray-400 uppercase">Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                        </label>

                        <label className="flex-1 flex flex-col items-center justify-center py-4 px-2 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all bg-white group">
                          <i className="fas fa-video text-blue-400 text-xl mb-1 group-hover:scale-110 transition-transform"></i>
                          <span className="text-[8px] font-black text-gray-400 uppercase">Video</span>
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
                        </label>

                        <button 
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex-1 flex flex-col items-center justify-center py-4 px-2 border-2 border-dashed rounded-2xl transition-all bg-white group ${
                            isRecording 
                              ? 'bg-red-50 border-red-400 animate-pulse' 
                              : 'border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                          }`}
                        >
                          <i className={`fas ${isRecording ? 'fa-stop text-red-500' : 'fa-microphone text-orange-400'} text-xl mb-1 group-hover:scale-110 transition-transform`}></i>
                          <span className="text-[8px] font-black text-gray-400 uppercase">{isRecording ? 'Stop' : 'Voice'}</span>
                        </button>
                     </div>
                   ) : (
                      <div className="relative bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner overflow-hidden border border-gray-100">
                            {activeItem.media.type === 'image' && <img src={activeItem.media.url} className="w-full h-full object-cover" />}
                            {activeItem.media.type === 'video' && <div className="text-xl">🎥</div>}
                            {activeItem.media.type === 'audio' && <div className="text-xl">🎤</div>}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-700 capitalize">{activeItem.media.type} Attached</span>
                            <p className="text-[9px] text-gray-400">Captured memory ✨</p>
                          </div>
                        </div>
                        <button 
                          onClick={removeMedia} 
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                   )}
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">The Story</label>
                   <textarea 
                     value={activeItem.text}
                     onChange={(e) => setActiveItem({ ...activeItem, text: e.target.value })}
                     className="w-full h-32 border-2 border-pink-50 rounded-2xl p-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-pink-300 outline-none resize-none transition-all bg-gray-50/50"
                     placeholder="What happened on this magical day?"
                     autoFocus
                   />
                </div>

                <div className="flex gap-4 pt-4">
                   {!isNew && (
                     <button 
                       onClick={() => {
                          onDeleteInteraction?.(activeItem.id);
                          setActiveItem(null);
                       }}
                       className="flex-1 py-4 bg-red-50 text-red-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
                     >
                       Delete
                     </button>
                   )}
                   <button 
                     onClick={handleSave}
                     disabled={!activeItem.text.trim()}
                     className="flex-[2] py-4 bg-pink-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all disabled:opacity-50 disabled:grayscale"
                   >
                     {isNew ? 'Create Milestone' : 'Update Memory'}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
