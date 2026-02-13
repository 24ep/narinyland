
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Interaction, MemoryItem } from '../types';

interface AppConfig {
  appName: string;
  anniversaryDate: string;
  treeStyle: string;
  galleryStyle: string;
  gallerySource: "manual" | "instagram";
  instagramUsername: string;
  daysPerTree: number;
  proposal: {
    q1: string;
    q2: string;
  };
  gallery: MemoryItem[];
  timeline: Interaction[];
  partners: {
    partner1: { name: string; avatar: string };
    partner2: { name: string; avatar: string };
  };
  coupons: {
    id: string;
    title: string;
    emoji: string;
    desc: string;
    color: string;
    expiry?: string;
    for?: string;
  }[];
}

interface EditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const EditDrawer: React.FC<EditDrawerProps> = ({ isOpen, onClose, config, setConfig }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'proposal' | 'gallery' | 'timeline' | 'coupons'>('general');
  
  // Local draft state so changes only apply when "Save" is clicked
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Instagram Fetch State
  const [igToken, setIgToken] = useState('');
  const [isFetchingIG, setIsFetchingIG] = useState(false);

  // Re-sync local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
      setHasChanges(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    setConfig(localConfig);
    setHasChanges(false);
    onClose();
  };

  const updateLocal = (updater: (prev: AppConfig) => AppConfig) => {
    setLocalConfig(updater);
    setHasChanges(true);
  };

  const handleInputChange = (field: string, value: any, nested?: string) => {
    updateLocal(prev => {
      const next = { ...prev };
      if (nested) {
        (next as any)[field] = { ...(next as any)[field], [nested]: value };
      } else {
        (next as any)[field] = value;
      }
      return next;
    });
  };

  const handlePartnerChange = (partnerId: 'partner1' | 'partner2', field: 'name' | 'avatar', value: string) => {
    updateLocal(prev => ({
      ...prev,
      partners: {
        ...prev.partners,
        [partnerId]: { ...prev.partners[partnerId], [field]: value }
      }
    }));
  };

  const handleGalleryUrlChange = (index: number, value: string) => {
    updateLocal(prev => {
      const newGallery = [...prev.gallery];
      newGallery[index] = { ...newGallery[index], url: value };
      return { ...prev, gallery: newGallery };
    });
  };

  const toggleGalleryPrivacy = (index: number) => {
    updateLocal(prev => {
      const newGallery = [...prev.gallery];
      newGallery[index] = { 
        ...newGallery[index], 
        privacy: newGallery[index].privacy === 'public' ? 'private' : 'public' 
      };
      return { ...prev, gallery: newGallery };
    });
  };

  const addGalleryImage = () => {
    updateLocal(prev => ({
      ...prev,
      gallery: [...prev.gallery, { url: "", privacy: 'public' }]
    }));
  };

  const removeGalleryImage = (index: number) => {
    updateLocal(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  // ACTUAL INSTAGRAM API FETCH
  const fetchInstagramFeed = async () => {
    if (!igToken) return alert("Please enter a valid Instagram Access Token.");
    setIsFetchingIG(true);
    
    try {
      // Fetch media from Instagram Graph API
      // Note: This fetches the user's media. The token must be valid.
      const response = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink&access_token=${igToken}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.data || data.data.length === 0) {
        alert("Token is valid, but no images were found on this account.");
        return;
      }

      const newItems: MemoryItem[] = data.data
        .filter((item: any) => item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM')
        .map((item: any) => ({
          url: item.media_url, // Direct CDN link
          privacy: 'public'
        }));

      // Append to gallery
      updateLocal(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newItems],
        gallerySource: 'instagram'
      }));

      alert(`Success! Imported ${newItems.length} photos from Instagram.`);
      setIgToken(''); // Clear token for security
    } catch (err: any) {
      console.error("IG Fetch Error:", err);
      alert(`Failed to fetch from Instagram: ${err.message}. Make sure your token is valid.`);
    } finally {
      setIsFetchingIG(false);
    }
  };

  const handleTimelineChange = (id: string, field: keyof Interaction, value: any) => {
    updateLocal(prev => ({
      ...prev,
      timeline: prev.timeline.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addTimelineEvent = () => {
    const newEvent: Interaction = {
      id: Date.now().toString(),
      text: "New milestone...",
      type: 'system',
      timestamp: new Date()
    };
    updateLocal(prev => ({ ...prev, timeline: [...prev.timeline, newEvent] }));
  };

  const handleCouponChange = (id: string, field: string, value: string) => {
    updateLocal(prev => ({
      ...prev,
      coupons: prev.coupons.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addCoupon = () => {
    const newCoupon = {
      id: Date.now().toString(),
      title: "New Coupon",
      emoji: "🎁",
      desc: "Valid for one free hug",
      color: "from-pink-100 to-rose-100",
      for: 'partner1'
    };
    updateLocal(prev => ({ ...prev, coupons: [...prev.coupons, newCoupon] }));
  };

  // Helper to transform Instagram URLs for the preview
  const getPreviewUrl = (url: string) => {
    if (!url) return "https://via.placeholder.com/150?text=Paste+Link";
    // Check if it's already a direct CDN link (from API fetch)
    if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) return url;

    // Fallback for manual 'p' links
    if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/') || url.includes('instagram.com/tv/')) {
      try {
        const urlObj = new URL(url);
        const cleanPath = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;
        return `https://www.instagram.com${cleanPath}/media/?size=l`;
      } catch (e) {
        const baseUrl = url.split('?')[0];
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBase}/media/?size=l`;
      }
    }
    return url;
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-y-0 right-0 w-full md:w-[550px] bg-white shadow-2xl z-[100] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             ⚙️ Settings
             {hasChanges && <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />}
           </h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customize your Narinyland</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <i className="fas fa-times text-xl text-gray-500"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-0 bg-gray-50 border-b overflow-x-auto no-scrollbar shrink-0">
        <div className="flex space-x-4">
          {['general', 'proposal', 'gallery', 'timeline', 'coupons'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-pink-500 text-pink-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-8 pb-32">
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-pink-400"></i> Core Setup
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">World Name</label>
                  <input 
                    type="text" 
                    value={localConfig.appName} 
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Anniversary</label>
                    <input 
                      type="date" 
                      value={localConfig.anniversaryDate ? localConfig.anniversaryDate.split('T')[0] : ''}
                      onChange={(e) => handleInputChange('anniversaryDate', new Date(e.target.value).toISOString())}
                      className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Forest Style</label>
                    <select 
                      value={localConfig.treeStyle} 
                      onChange={(e) => handleInputChange('treeStyle', e.target.value)}
                      className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none bg-white"
                    >
                      <option value="oak">Classic Oak 🌳</option>
                      <option value="sakura">Sakura 🌸</option>
                      <option value="neon">Neon 🔮</option>
                      <option value="frozen">Frozen ❄️</option>
                      <option value="golden">Golden ☀️</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-user-friends text-blue-400"></i> The Couple
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-pink-500 uppercase border-b pb-1">Her</h4>
                   <input 
                     type="text" 
                     value={localConfig.partners.partner1.name} 
                     onChange={(e) => handlePartnerChange('partner1', 'name', e.target.value)}
                     className="w-full border rounded-xl p-3 text-sm"
                     placeholder="Name"
                   />
                   <input 
                     type="text" 
                     value={localConfig.partners.partner1.avatar} 
                     onChange={(e) => handlePartnerChange('partner1', 'avatar', e.target.value)}
                     className="w-full border rounded-xl p-3 text-2xl text-center"
                     placeholder="👩"
                   />
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-blue-500 uppercase border-b pb-1">Him</h4>
                   <input 
                     type="text" 
                     value={localConfig.partners.partner2.name} 
                     onChange={(e) => handlePartnerChange('partner2', 'name', e.target.value)}
                     className="w-full border rounded-xl p-3 text-sm"
                     placeholder="Name"
                   />
                   <input 
                     type="text" 
                     value={localConfig.partners.partner2.avatar} 
                     onChange={(e) => handlePartnerChange('partner2', 'avatar', e.target.value)}
                     className="w-full border rounded-xl p-3 text-2xl text-center"
                     placeholder="👨"
                   />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Gallery Interaction</label>
                <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-4">
                   <button 
                     onClick={() => handleInputChange('gallerySource', 'manual')}
                     className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${localConfig.gallerySource === 'manual' ? 'bg-white shadow-md text-pink-500' : 'text-gray-500'}`}
                   >
                     Manual Uploads
                   </button>
                   <button 
                     onClick={() => handleInputChange('gallerySource', 'instagram')}
                     className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${localConfig.gallerySource === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md text-white' : 'text-gray-500'}`}
                   >
                     <i className="fab fa-instagram"></i> Instagram Mode
                   </button>
                </div>

                <AnimatePresence mode="wait">
                  {localConfig.gallerySource === 'instagram' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <div className="p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                          <p className="text-[11px] text-purple-600 font-bold leading-relaxed mb-3">
                             <i className="fas fa-magic mr-1"></i> <strong>Real Import:</strong> Enter your Instagram Basic Display Access Token to fetch your actual feed.
                             <a href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started" target="_blank" rel="noopener noreferrer" className="ml-1 underline text-pink-500">Get Token</a>
                          </p>
                          
                          <div className="flex gap-2">
                             <input 
                               type="text" 
                               placeholder="Paste Access Token (e.g. IGQV...)"
                               value={igToken}
                               onChange={(e) => setIgToken(e.target.value)}
                               className="flex-1 bg-white border border-purple-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-300 outline-none font-mono"
                             />
                             <button 
                               onClick={fetchInstagramFeed}
                               disabled={isFetchingIG}
                               className="bg-purple-600 text-white font-bold px-4 rounded-xl text-xs disabled:opacity-50"
                             >
                               {isFetchingIG ? <i className="fas fa-spinner fa-spin"></i> : 'Fetch'}
                             </button>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic">Alternatively, you can still manually paste public post links below.</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex justify-between items-center px-2">
               <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-widest">Memories & Links</h3>
               <button onClick={addGalleryImage} className="bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md">
                  + Add Item
               </button>
             </div>
             
             <div className="space-y-4">
              {localConfig.gallery.map((item, idx) => {
                const isIG = item.url.includes('instagram.com') || item.url.includes('cdninstagram.com');
                return (
                  <motion.div key={idx} layout className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center group relative">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border relative">
                        <img 
                          src={getPreviewUrl(item.url)} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150?text=Invalid")} 
                        />
                        {isIG && <div className="absolute inset-0 bg-pink-500/10 pointer-events-none" />}
                        {isIG && <div className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-tr from-yellow-400 to-purple-600 text-white flex items-center justify-center rounded-full text-[8px] shadow-sm"><i className="fab fa-instagram"></i></div>}
                    </div>
                    <div className="flex-1 space-y-2">
                        <input 
                          type="text" 
                          placeholder={isIG ? "IG Link" : "Image URL"}
                          value={item.url} 
                          onChange={(e) => handleGalleryUrlChange(idx, e.target.value)}
                          className={`w-full border-2 border-gray-50 rounded-xl px-3 py-2 text-[11px] font-mono text-gray-600 focus:border-blue-200 outline-none ${isIG ? 'bg-pink-50/20 border-pink-100' : ''}`}
                        />
                        <div className="flex items-center justify-between">
                           <button 
                             onClick={() => toggleGalleryPrivacy(idx)}
                             className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all border ${item.privacy === 'private' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                           >
                             <i className={`fas ${item.privacy === 'private' ? 'fa-lock' : 'fa-eye'} mr-1.5`}></i>
                             {item.privacy === 'private' ? 'Private Vault' : 'Public View'}
                           </button>
                           <button onClick={() => removeGalleryImage(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                             <i className="fas fa-trash-alt"></i>
                           </button>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Other tabs follow the same pattern, simplified for brevity here */}
        {activeTab === 'timeline' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-widest">Our Story</h3>
                 <button onClick={addTimelineEvent} className="bg-pink-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-md">+ New Event</button>
              </div>
              {localConfig.timeline.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex gap-2">
                       <input 
                         type="datetime-local" 
                         value={new Date(item.timestamp.getTime() - item.timestamp.getTimezoneOffset() * 60000).toISOString().slice(0, 16)} 
                         onChange={(e) => handleTimelineChange(item.id, 'timestamp', new Date(e.target.value))}
                         className="flex-1 text-xs border rounded-xl p-2 bg-gray-50"
                       />
                       <select 
                         value={item.type} 
                         onChange={(e) => handleTimelineChange(item.id, 'type', e.target.value)}
                         className="text-xs border rounded-xl p-2 bg-gray-50"
                       >
                          <option value="system">Event</option>
                          <option value="pet">Message</option>
                       </select>
                    </div>
                    <textarea 
                      value={item.text} 
                      onChange={(e) => handleTimelineChange(item.id, 'text', e.target.value)}
                      className="w-full text-sm border rounded-xl p-3 focus:border-pink-200 outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                       <button 
                         onClick={() => updateLocal(prev => ({ ...prev, timeline: prev.timeline.filter(t => t.id !== item.id) }))}
                         className="text-[10px] font-black text-red-400 uppercase tracking-widest p-1"
                       >Delete</button>
                    </div>
                 </div>
              ))}
           </motion.div>
        )}

        {activeTab === 'coupons' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-widest">Gifts & Vouchers</h3>
                 <button onClick={addCoupon} className="bg-purple-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-md">+ Add Coupon</button>
              </div>
              {localConfig.coupons.map(coupon => (
                 <div key={coupon.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         value={coupon.emoji} 
                         onChange={(e) => handleCouponChange(coupon.id, 'emoji', e.target.value)}
                         className="w-14 text-center border rounded-xl p-2 text-2xl"
                       />
                       <input 
                         type="text" 
                         value={coupon.title} 
                         onChange={(e) => handleCouponChange(coupon.id, 'title', e.target.value)}
                         className="flex-1 border rounded-xl p-3 font-bold text-sm"
                       />
                    </div>
                    <input 
                      type="text" 
                      value={coupon.desc} 
                      onChange={(e) => handleCouponChange(coupon.id, 'desc', e.target.value)}
                      className="w-full border rounded-xl p-3 text-xs"
                      placeholder="Coupon description..."
                    />
                    <div className="flex justify-between items-center">
                       <select 
                         value={coupon.for} 
                         onChange={(e) => handleCouponChange(coupon.id, 'for', e.target.value)}
                         className="text-[10px] font-black border rounded-lg p-1 bg-gray-50 uppercase"
                       >
                          <option value="partner1">Her</option>
                          <option value="partner2">Him</option>
                       </select>
                       <button 
                         onClick={() => updateLocal(prev => ({ ...prev, coupons: prev.coupons.filter(c => c.id !== coupon.id) }))}
                         className="text-[10px] font-black text-red-400 uppercase tracking-widest"
                       >Remove</button>
                    </div>
                 </div>
              ))}
           </motion.div>
        )}
      </div>

      {/* STICKY SAVE FOOTER */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t flex gap-4 z-50">
        <button 
          onClick={onClose}
          className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex-[2] py-4 font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl transition-all ${
            hasChanges 
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:scale-[1.02] shadow-pink-200' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          Save Changes ✨
        </button>
      </div>
    </motion.div>
  );
};

export default EditDrawer;
