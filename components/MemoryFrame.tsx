
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryItem } from '../types';

interface MemoryFrameProps {
  isVisible: boolean;
  items: MemoryItem[];
  style?: string; // 'polaroid' | 'carousel'
  source?: 'manual' | 'instagram';
  username?: string;
  viewMode: 'all' | 'public' | 'private';
  onViewModeChange: (mode: 'all' | 'public' | 'private') => void;
}

const MemoryFrame: React.FC<MemoryFrameProps> = ({ 
  isVisible, 
  items, 
  style = 'polaroid', 
  source = 'manual', 
  username,
  viewMode,
  onViewModeChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Helper to detect and transform Instagram post links to direct image URLs
  const getDisplayUrl = (url: string) => {
    if (!url) return "https://via.placeholder.com/600x600?text=No+Image";
    
    // If it's a direct CDN link (e.g. from the API fetch), use it directly
    if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
      return url;
    }

    // Manual manual 'p' link fallback transformation
    if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/') || url.includes('instagram.com/tv/')) {
      try {
        const urlObj = new URL(url);
        // Remove trailing slash if present to normalize, then add the endpoint
        const cleanPath = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;
        return `https://www.instagram.com${cleanPath}/media/?size=l`;
      } catch (e) {
        // Fallback for malformed URLs
        const baseUrl = url.split('?')[0];
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBase}/media/?size=l`;
      }
    }
    return url;
  };

  const isInstagramLink = (url: string) => url.includes('instagram.com') || url.includes('cdninstagram.com');

  const filteredItems = useMemo(() => {
    if (viewMode === 'all') return items;
    return items.filter(item => item.privacy === viewMode);
  }, [items, viewMode]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [viewMode]);

  useEffect(() => {
    if (isVisible && !isZoomed && style === 'polaroid' && filteredItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
      }, 4000); 
      return () => clearInterval(interval);
    }
  }, [isVisible, filteredItems.length, isZoomed, style]);

  useEffect(() => {
    if (isVisible && !isZoomed && style === 'carousel' && !isHovering && filteredItems.length > 0) {
      const interval = setInterval(() => {
        if (scrollContainerRef.current) {
           const nextIndex = (currentIndex + 1) % filteredItems.length;
           scrollToIndex(nextIndex);
        }
      }, 4000); 
      return () => clearInterval(interval);
    }
  }, [isVisible, isZoomed, style, isHovering, currentIndex, filteredItems.length]);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
       const container = scrollContainerRef.current;
       const children = container.children;
       if (children[index]) {
         const child = children[index] as HTMLElement;
         const newLeft = child.offsetLeft - (container.clientWidth / 2) + (child.clientWidth / 2);
         container.scrollTo({ left: newLeft, behavior: 'smooth' });
       }
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && style === 'carousel') {
      const container = scrollContainerRef.current;
      const center = container.scrollLeft + (container.clientWidth / 2);
      
      let closestIndex = 0;
      let minDistance = Infinity;

      Array.from(container.children).forEach((child, index) => {
        const c = child as HTMLElement;
        const childCenter = c.offsetLeft + (c.clientWidth / 2);
        const dist = Math.abs(center - childCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });
      
      if (closestIndex !== currentIndex) {
        setCurrentIndex(closestIndex);
      }
    }
  };

  const handleZoom = (img: string) => {
    setZoomedImage(getDisplayUrl(img));
    setIsZoomed(true);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="relative w-full max-w-4xl mx-auto px-4 z-10 flex flex-col items-center">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
           <div className="flex flex-col">
              <h2 className="font-pacifico text-3xl text-pink-500 drop-shadow-sm">Our Memories</h2>
              {(source === 'instagram' || (filteredItems[currentIndex] && isInstagramLink(filteredItems[currentIndex].url))) && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-2 mt-2"
                 >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white text-[9px] shadow-sm">
                       <i className="fab fa-instagram"></i>
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {username ? `@${username}` : 'Instagram Feed'}
                    </span>
                 </motion.div>
              )}
           </div>

           <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl shadow-inner border border-white">
              <button
                onClick={() => onViewModeChange('all')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                  viewMode === 'all' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-pink-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onViewModeChange('public')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${
                  viewMode === 'public' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-pink-500'
                }`}
              >
                <i className="fas fa-eye text-[8px]"></i> Public
              </button>
              <button
                onClick={() => onViewModeChange('private')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 ${
                  viewMode === 'private' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-purple-600'
                }`}
              >
                <i className="fas fa-lock text-[8px]"></i> Private
              </button>
           </div>
        </div>

        {filteredItems.length === 0 ? (
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-24 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-pink-200 flex flex-col items-center justify-center text-pink-300 shadow-sm"
           >
              <div className="text-7xl mb-4">🙊</div>
              <p className="font-pacifico text-2xl">No {viewMode} memories yet!</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Add some in the settings!</p>
           </motion.div>
        ) : (
          <div className="w-full">
            {style === 'polaroid' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mx-auto"
              >
                <div className="relative bg-white p-3 pb-16 shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-8 border-white rounded-sm transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                  <div 
                    className="relative w-full aspect-square overflow-hidden bg-gray-50 rounded-sm cursor-zoom-in group"
                    onClick={() => handleZoom(filteredItems[currentIndex].url)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={filteredItems[currentIndex].url}
                        src={getDisplayUrl(filteredItems[currentIndex].url)}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1516589174184-c6848463ea2a?q=80&w=800&auto=format&fit=crop"; // Fallback image
                        }}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "anticipate" }}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Our Memory"
                      />
                    </AnimatePresence>
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                       {filteredItems[currentIndex].privacy === 'private' && (
                         <div className="w-8 h-8 bg-purple-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white text-[10px] shadow-lg border border-white/30">
                            <i className="fas fa-lock"></i>
                         </div>
                       )}
                    </div>

                    {(source === 'instagram' || isInstagramLink(filteredItems[currentIndex].url)) && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg border border-white/30">
                        <i className="fab fa-instagram text-[11px]"></i>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-500">
                      <i className="fas fa-expand text-white text-3xl drop-shadow-lg"></i>
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-0 w-full text-center">
                    <p className="font-pacifico text-pink-500 text-2xl tracking-wide">
                       {viewMode === 'private' ? 'Secret Moments' : 'Everlasting Love'}
                    </p>
                  </div>

                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-32 h-10 bg-pink-100/40 rotate-[-1deg] backdrop-blur-md shadow-sm border border-white/20"></div>
                
                  <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    {filteredItems.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx === currentIndex ? 'bg-pink-500 scale-150 shadow-sm' : 'bg-pink-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {style === 'carousel' && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full flex flex-col gap-6"
                 onMouseEnter={() => setIsHovering(true)}
                 onMouseLeave={() => setIsHovering(false)}
               >
                  <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto pb-12 gap-8 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
                  >
                     {filteredItems.map((item, idx) => (
                        <motion.div 
                          key={item.url}
                          layout
                          whileHover={{ scale: 1.05, y: -8 }}
                          className="snap-center shrink-0 w-72 md:w-96 bg-white p-3 pb-16 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2rem] transition-all cursor-zoom-in relative border-4 border-white group"
                          onClick={() => handleZoom(item.url)}
                        >
                           <div className="w-full h-64 md:h-80 overflow-hidden rounded-[1.5rem] bg-gray-50 relative border border-gray-100">
                              <img 
                                src={getDisplayUrl(item.url)} 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1516589174184-c6848463ea2a?q=80&w=800&auto=format&fit=crop";
                                }}
                                alt={`Memory ${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                              />
                              
                              <div className="absolute top-3 left-3 flex gap-2">
                                 {item.privacy === 'private' && (
                                   <div className="bg-purple-600/90 backdrop-blur-md p-2.5 rounded-full text-white shadow-lg border border-white/20">
                                      <i className="fas fa-lock text-[10px]"></i>
                                   </div>
                                 )}
                              </div>

                              {(source === 'instagram' || isInstagramLink(item.url)) && (
                                <div className="absolute top-3 right-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 backdrop-blur-md p-2.5 rounded-full text-white shadow-lg border border-white/20">
                                  <i className="fab fa-instagram text-xs"></i>
                                </div>
                              )}
                           </div>
                           <p className="absolute bottom-4 left-0 w-full text-center font-pacifico text-pink-400 text-xl tracking-wide">
                              {item.privacy === 'private' ? 'Our Secret' : `Chapter ${idx + 1}`}
                           </p>
                        </motion.div>
                     ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    {filteredItems.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToIndex(idx)}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-700 ${
                          idx === currentIndex 
                            ? 'bg-pink-500 scale-125 shadow-md w-8' 
                            : 'bg-pink-200 hover:bg-pink-300'
                        }`}
                        aria-label={`Go to memory ${idx + 1}`}
                      />
                    ))}
                  </div>
               </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isZoomed && zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/98 backdrop-blur-xl p-6"
            onClick={() => setIsZoomed(false)}
          >
            <button className="absolute top-10 right-10 text-white text-6xl font-light hover:text-pink-400 transition-colors">&times;</button>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative max-w-6xl max-h-[85vh] group"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={zoomedImage} 
                referrerPolicy="no-referrer"
                onError={(e) => {
                   e.currentTarget.src = "https://images.unsplash.com/photo-1516589174184-c6848463ea2a?q=80&w=800&auto=format&fit=crop";
                }}
                alt="Zoomed Memory" 
                className="w-full h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(236,72,153,0.2)] border-4 border-white/10"
              />
              <div className="absolute -bottom-16 left-0 w-full flex justify-center gap-4">
                {items.find(i => getDisplayUrl(i.url) === zoomedImage)?.privacy === 'private' && (
                  <div className="bg-purple-600/90 px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/20">
                    <i className="fas fa-lock"></i> Locked Vault Memory
                  </div>
                )}
                {(zoomedImage.includes('instagram.com') || zoomedImage.includes('cdninstagram.com')) && (
                   <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/20">
                      <i className="fab fa-instagram"></i> Instagram Highlight
                   </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MemoryFrame;
