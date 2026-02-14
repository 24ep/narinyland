"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Interaction, MemoryItem, AppConfig, Emotion } from '../types';
import { uploadAPI } from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface EditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onSave?: () => void;
}

const EditDrawer: React.FC<EditDrawerProps> = ({ isOpen, onClose, config, setConfig, onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'proposal' | 'gallery' | 'timeline' | 'coupons'>('general');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Local draft state so changes only apply when "Save" is clicked
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Instagram Fetch State
  const [igToken, setIgToken] = useState('');
  const [isFetchingIG, setIsFetchingIG] = useState(false);
  const [igProfileResult, setIgProfileResult] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null); // index of item being uploaded
  const [previewItem, setPreviewItem] = useState<{ url: string; type: 'image' | 'video' | 'audio' } | null>(null);

  // Fetch posts from a public Instagram profile (username-based, no token)
  const fetchInstagramProfile = async () => {
    const username = localConfig.instagramUsername?.trim();
    if (!username) return;

    setIsFetchingIG(true);
    setIgProfileResult(null);
    try {
      const res = await fetch(`/api/instagram/profile/${encodeURIComponent(username)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setIgProfileResult(`❌ ${data.error || 'Failed to fetch profile'}`);
        return;
      }

      if (data.posts?.length === 0) {
        setIgProfileResult(`⚠️ No public posts found for @${username}`);
        return;
      }

      // Add the found posts to the gallery (avoid duplicates)
      const existingUrls = new Set(localConfig.gallery.map((g: any) => g.url));
      const newItems = data.posts
        .filter((p: any) => !existingUrls.has(p.thumbnail || p.url))
        .map((p: any) => ({ url: p.thumbnail || p.url, privacy: 'public' as const }));

      if (newItems.length === 0) {
        setIgProfileResult(`✅ All ${data.postCount} posts from @${username} are already in gallery`);
        return;
      }

      updateLocal(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newItems],
      }));

      setIgProfileResult(`✅ Added ${newItems.length} posts from @${data.displayName || username}`);
    } catch (err: any) {
      setIgProfileResult(`❌ ${err.message}`);
    } finally {
      setIsFetchingIG(false);
    }
  };

  // Fetch feed using Instagram API token (bulk import)
  const fetchInstagramFeed = async () => {
    if (!igToken.trim()) return;
    setIsFetchingIG(true);
    try {
      const res = await fetch(`https://graph.instagram.com/me/media?fields=id,media_url,permalink,caption,timestamp&access_token=${igToken}`);
      const data = await res.json();

      if (data.error) {
        alert(`Instagram API Error: ${data.error.message}`);
        return;
      }

      if (!data.data?.length) {
        alert('No media found in your Instagram feed.');
        return;
      }

      const existingUrls = new Set(localConfig.gallery.map((g: any) => g.url));
      const newItems = data.data
        .filter((m: any) => m.media_url && !existingUrls.has(m.permalink))
        .map((m: any) => ({
          url: m.permalink || m.media_url,
          privacy: 'public' as const,
        }));

      updateLocal(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newItems],
      }));

      alert(`Added ${newItems.length} photos from Instagram!`);
    } catch (err: any) {
      alert(`Failed to fetch: ${err.message}`);
    } finally {
      setIsFetchingIG(false);
    }
  };

  // Re-sync local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      const cloned = JSON.parse(JSON.stringify(config));
      // Re-hydrate Date objects that were serialized to strings
      if (cloned.timeline) {
        cloned.timeline = cloned.timeline.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
      setLocalConfig(cloned);
      setHasChanges(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    setConfig(localConfig);
    if (onSave) onSave();
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

  const handleTimelineChange = (id: string, field: keyof Interaction, value: any) => {
    updateLocal(prev => ({
      ...prev,
      timeline: prev.timeline.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleFileUpload = async (index: number, file: File) => {
    try {
      setIsUploading(index);
      const result = await uploadAPI.upload(file, 'gallery');
      handleGalleryUrlChange(index, result.url);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(null);
    }
  };

  const handleMultiFileUpload = async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    setIsFetchingIG(true); // Reusing fetch state for upload indicator if needed, or just let it be
    try {
      const uploadPromises = filesArray.map(file => uploadAPI.upload(file, 'gallery'));
      const results = await Promise.all(uploadPromises);
      
      const newItems = results.map(res => ({
        url: res.url,
        privacy: 'public' as const
      }));

      updateLocal(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newItems]
      }));
    } catch (err: any) {
      alert(`Some uploads failed: ${err.message}`);
    } finally {
      setIsFetchingIG(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleMultiFileUpload(e.dataTransfer.files);
    }
  };

  const handleTimelineFileUpload = async (id: string, file: File) => {
    try {
      const type = file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'image';
      const result = await uploadAPI.upload(file, 'timeline');
      updateLocal(prev => ({
        ...prev,
        timeline: prev.timeline.map(item => item.id === id ? { ...item, media: { type: type as any, url: result.url } } : item)
      }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const isAudio = (url: string) => /\.(mp3|wav|ogg|m4a)$/i.test(url) || url.includes('audio');
  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url) || url.includes('video');

  const addTimelineEvent = () => {
    const newEvent: Interaction = {
      id: Date.now().toString(),
      text: "New milestone...",
      type: 'system',
      timestamp: new Date()
    };
    updateLocal(prev => ({ ...prev, timeline: [...prev.timeline, newEvent] }));
  };

  const handleCouponChange = (id: string, field: string, value: any) => {
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
      for: 'partner1',
      points: 0
    };
    updateLocal(prev => ({ ...prev, coupons: [...prev.coupons, newCoupon] }));
  };

  const handlePetChange = (id: string, field: string, value: any) => {
    updateLocal(prev => ({
      ...prev,
      pets: (prev.pets || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addPet = () => {
    const newPet = {
      id: Date.now().toString(),
      type: 'dog',
      name: 'New Friend'
    };
    updateLocal(prev => ({
      ...prev,
      pets: [...(prev.pets || []), newPet]
    }));
  };

  const removePet = (id: string) => {
    updateLocal(prev => ({
      ...prev,
      pets: (prev.pets || []).filter(p => p.id !== id)
    }));
  };

  const updateProposalQuestion = (index: number, value: string) => {
    updateLocal(prev => {
      const newQuestions = [...prev.proposal.questions];
      newQuestions[index] = value;
      return { ...prev, proposal: { ...prev.proposal, questions: newQuestions } };
    });
  };

  const setProposalProgress = (index: number) => {
    updateLocal(prev => ({
      ...prev,
      proposal: { ...prev.proposal, progress: index }
    }));
  };

  const addProposalQuestion = () => {
    updateLocal(prev => ({
      ...prev,
      proposal: {
        ...prev.proposal,
        questions: [...prev.proposal.questions, "New Question?"]
      }
    }));
  };

  const removeProposalQuestion = (index: number) => {
    updateLocal(prev => ({
      ...prev,
      proposal: {
        ...prev.proposal,
        questions: prev.proposal.questions.filter((_, i) => i !== index)
      }
    }));
  };

  // Helper to transform Instagram URLs for the preview
  const getPreviewUrl = (url: string) => {
    if (!url) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EPaste Link%3C/text%3E%3C/svg%3E";
    // If it's an Instagram post URL or CDN URL, proxy through our backend
    if (/instagram\.com\/(p|reel|tv)\//.test(url) || /(cdninstagram|fbcdn)/.test(url)) {
      return `/api/instagram/image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      className="fixed inset-y-0 right-0 w-full md:w-[550px] md:top-6 md:right-6 md:bottom-6 md:h-[calc(100vh-3rem)] bg-white shadow-2xl z-[100] flex flex-col md:rounded-[3rem] overflow-hidden"
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
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Background Music (YouTube)</label>
                  <input 
                    type="text" 
                    value={localConfig.musicUrl || ''}
                    onChange={(e) => handleInputChange('musicUrl', e.target.value)}
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none transition-all"
                    placeholder="Paste YouTube Link"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Anniversary</label>
                    <DatePicker
                      selected={localConfig.anniversaryDate ? new Date(localConfig.anniversaryDate) : null}
                      onChange={(date: Date | null) => handleInputChange('anniversaryDate', date ? date.toISOString() : '')}
                      dateFormat="MMMM d, yyyy"
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
                      <option value="midnight">Midnight Magic ✨</option>
                      <option value="frozen">Frozen ❄️</option>
                      <option value="golden">Golden ☀️</option>
                    </select>
                  </div>
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest ml-1">Dynamic Pets Management</label>
                      <button 
                        onClick={addPet}
                        className="bg-pink-100 text-pink-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-pink-200 transition-all"
                      >
                        + Add Pet
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Show old single pet if pets array is empty */}
                      {(!localConfig.pets || localConfig.pets.length === 0) && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                           <div className="flex-1">
                              <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Primary Pet Type</label>
                              <select 
                                value={localConfig.petType || 'cat'} 
                                onChange={(e) => handleInputChange('petType', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold outline-none"
                              >
                                <option value="cat">Fluffy Cat 🐱</option>
                                <option value="dog">Loyal Dog 🐶</option>
                                <option value="rabbit">Soft Rabbit 🐰</option>
                                <option value="panda">Chubby Panda 🐼</option>
                                <option value="fox">Red Fox 🦊</option>
                              </select>
                           </div>
                           <p className="text-[9px] text-gray-400 italic max-w-[120px]">This is your legacy pet. Add more to go dynamic! ✨</p>
                        </div>
                      )}

                      {/* Render Multiple Pets */}
                      {(localConfig.pets || []).map((pet, idx) => (
                        <motion.div 
                          key={pet.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-pink-50/30 rounded-2xl border border-pink-100 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-pink-50">
                            {pet.type === 'cat' && '🐱'}
                            {pet.type === 'dog' && '🐶'}
                            {pet.type === 'rabbit' && '🐰'}
                            {pet.type === 'panda' && '🐼'}
                            {pet.type === 'fox' && '🦊'}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-[7px] font-black text-pink-400 uppercase mb-0.5">Pet Name</label>
                                <input 
                                  type="text"
                                  value={pet.name || ''}
                                  onChange={(e) => handlePetChange(pet.id, 'name', e.target.value)}
                                  className="w-full bg-white border border-pink-50 rounded-lg p-1.5 text-[10px] font-bold outline-none"
                                  placeholder="Name..."
                                />
                             </div>
                             <div>
                                <label className="block text-[7px] font-black text-pink-400 uppercase mb-0.5">Animal Type</label>
                                <select 
                                  value={pet.type} 
                                  onChange={(e) => handlePetChange(pet.id, 'type', e.target.value)}
                                  className="w-full bg-white border border-pink-50 rounded-lg p-1.5 text-[10px] font-bold outline-none"
                                >
                                  <option value="cat">Cat 🐱</option>
                                  <option value="dog">Dog 🐶</option>
                                  <option value="rabbit">Rabbit 🐰</option>
                                  <option value="panda">Panda 🐼</option>
                                  <option value="fox">Fox 🦊</option>
                                </select>
                             </div>
                          </div>
                          <button 
                            onClick={() => removePet(pet.id)}
                            className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Sky Time</label>
                    <select 
                      value={localConfig.skyMode || 'follow_timezone'} 
                      onChange={(e) => handleInputChange('skyMode', e.target.value)}
                      className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none bg-white"
                    >
                      <option value="follow_timezone">Device Timezone 🕒</option>
                      <option value="noon">Always Noon ☀️</option>
                      <option value="night">Always Night 🌙</option>
                    </select>
                  </div>
                  <div className="col-span-2 bg-pink-50/30 p-4 rounded-2xl flex items-center justify-between border border-pink-50">
                     <div>
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-2 italic">
                           <i className="fas fa-qrcode text-pink-500"></i> Show Mobile Upload QR
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 ml-6">Floating QR code at bottom-left</p>
                     </div>
                     <button 
                       onClick={() => handleInputChange('showQRCode', !localConfig.showQRCode)}
                       className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${localConfig.showQRCode ? 'bg-pink-500 justify-end' : 'bg-gray-200 justify-start'}`}
                     >
                        <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                     </button>
                  </div>
                  <div className="col-span-2 mt-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">Example View Mode</label>
                     <div className="flex bg-gray-100 p-1 rounded-2xl">
                        <button 
                           onClick={() => handleInputChange('viewMode', '3d')}
                           className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-white text-pink-500 shadow-md"
                        >
                           <i className='fas fa-cube'></i> 3D Garden
                        </button>
                     </div>
                  </div>
                  <div className="col-span-2 mt-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">Graphics Quality</label>
                     <select 
                       value={localConfig.graphicsQuality || 'medium'} 
                       onChange={(e) => handleInputChange('graphicsQuality', e.target.value)}
                       className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none bg-white font-bold text-sm"
                     >
                       <option value="low">Low (Fastest) ⚡</option>
                       <option value="medium">Medium (Balanced) ⚖️</option>
                       <option value="high">High (Best Visuals) ✨</option>
                     </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-seedling text-green-400"></i> Growth Settings
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Days per Tree</label>
                    <input 
                      type="number" 
                      value={localConfig.daysPerTree} 
                      onChange={(e) => handleInputChange('daysPerTree', parseInt(e.target.value))}
                      className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Days per Flower</label>
                    <input 
                      type="number" 
                      value={localConfig.daysPerFlower || 7} 
                      onChange={(e) => handleInputChange('daysPerFlower', parseInt(e.target.value))}
                      className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Flower Species</label>
                  <select 
                    value={localConfig.flowerType || 'sunflower'} 
                    onChange={(e) => handleInputChange('flowerType', e.target.value)}
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none bg-white font-bold"
                  >
                    <option value="sunflower">🌻 Sunflower</option>
                    <option value="tulip">🌷 Tulip</option>
                    <option value="rose">🌹 Rose</option>
                    <option value="cherry">🌸 Cherry Blossom</option>
                    <option value="lavender">🪻 Lavender</option>
                    <option value="cactus">🌵 Cactus (Rare)</option>
                    <option value="heart">💖 Heart Bloom</option>
                    <option value="mixed">🌈 Mixed Garden</option>
                  </select>

                  {localConfig.flowerType === 'mixed' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pink-50/50 p-4 rounded-3xl border border-pink-100 flex flex-wrap gap-2"
                    >
                      <p className="w-full text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1 ml-1">Include in Mix:</p>
                      {[
                        { id: 'sunflower', label: '🌻' },
                        { id: 'tulip', label: '🌷' },
                        { id: 'rose', label: '🌹' },
                        { id: 'cherry', label: '🌸' },
                        { id: 'lavender', label: '🪻' },
                        { id: 'cactus', label: '🌵' },
                        { id: 'heart', label: '💖' }
                      ].map(f => {
                        const isSelected = localConfig.mixedFlowers?.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              const current = localConfig.mixedFlowers || [];
                              const next = isSelected 
                                ? current.filter(id => id !== f.id)
                                : [...current, f.id];
                              handleInputChange('mixedFlowers', next);
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border-2 ${
                              isSelected 
                                ? 'bg-white border-pink-400 shadow-sm scale-110' 
                                : 'bg-gray-50 border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
                            }`}
                            title={f.id}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-stream text-purple-400"></i> Timeline Display
              </h3>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">Default Rows Shown</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" max="20" 
                    value={localConfig.timelineDefaultRows || 5} 
                    onChange={(e) => handleInputChange('timelineDefaultRows', parseInt(e.target.value))}
                    className="flex-1 accent-pink-500"
                  />
                  <span className="text-lg font-black text-pink-500 w-8 text-center">{localConfig.timelineDefaultRows || 5}</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 ml-1">Number of year rows visible before "Explore Further" button</p>
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

        {activeTab === 'proposal' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="fas fa-heart text-red-400"></i> Proposal Flow
                </h3>
                <button 
                  onClick={addProposalQuestion}
                  className="bg-red-50 text-red-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                >
                  + Add Step
                </button>
              </div>
              
              <div className="space-y-4">
                {localConfig.proposal.questions.map((q, idx) => (
                  <div key={idx} className="relative group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-1">
                      Step {idx + 1}
                    </label>
                    <div className="flex gap-2">
                      <textarea 
                        value={q} 
                        onChange={(e) => updateProposalQuestion(idx, e.target.value)}
                        className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-pink-200 outline-none transition-all resize-none bg-gray-50/30"
                        rows={2}
                        placeholder={`Question ${idx + 1}`}
                      />
                      {localConfig.proposal.questions.length > 1 && (
                        <button 
                          onClick={() => removeProposalQuestion(idx)}
                          className="self-center p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-check-circle text-green-400"></i> Proposal Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-700">Completion</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {localConfig.proposal.progress || 0} / {localConfig.proposal.questions.length} Questions Read
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setProposalProgress(0)}
                         className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-gray-300"
                       >
                         Reset All
                       </button>
                       <button 
                         onClick={() => setProposalProgress(localConfig.proposal.questions.length)}
                         className="px-3 py-1.5 bg-green-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-green-600"
                       >
                         Mark All Read
                       </button>
                    </div>
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="flex gap-1.5 mt-2">
                    {localConfig.proposal.questions.map((_, i) => {
                      const isRead = (localConfig.proposal.progress || 0) > i;
                      return (
                        <button 
                          key={i}
                          onClick={() => setProposalProgress(isRead ? i : i + 1)}
                          className={`flex-1 h-2 rounded-full transition-all ${isRead ? 'bg-green-500' : 'bg-gray-200'}`}
                          title={`Question ${i+1}: ${isRead ? 'Read' : 'Unread'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Proposal Fully Accepted</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {localConfig.proposal.isAccepted ? '✨ Final YES Received' : '❌ Outcome Pending'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      updateLocal(prev => ({
                        ...prev,
                        proposal: { ...prev.proposal, isAccepted: !prev.proposal.isAccepted }
                      }));
                    }}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      localConfig.proposal.isAccepted 
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {localConfig.proposal.isAccepted ? 'Reset Acceptance' : 'Mark as Accepted'}
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-gray-400 mt-3 ml-1 italic">
                * The proposal screen skips "Read" questions. If progress is reset to 0, it starts from Question 1.
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-2xl border-2 border-dashed border-red-100">
              <p className="text-[11px] text-red-600 font-bold leading-relaxed flex items-center gap-2">
                <i className="fas fa-magic"></i>
                The user can only accept your proposal. Each "Yes" leads to the next question until the final acceptance!
              </p>
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
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
                       <div className="p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                          <p className="text-[11px] text-purple-600 font-bold leading-relaxed">
                             <i className="fab fa-instagram mr-1"></i> <strong>Paste URLs:</strong> Add any public Instagram post link below and the photo will display automatically!
                          </p>
                       </div>

                       {/* Public Profile Fetch */}
                       <div className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border-2 border-dashed border-violet-200">
                          <p className="text-[11px] text-violet-600 font-bold leading-relaxed mb-3">
                             <i className="fas fa-user-circle mr-1"></i> <strong>Import from Profile:</strong> Enter any public Instagram username to pull their recent posts.
                          </p>
                          <div className="flex gap-2">
                             <div className="flex-1 relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-300 text-xs font-bold">@</span>
                               <input 
                                 type="text" 
                                 placeholder="username"
                                 value={localConfig.instagramUsername || ''}
                                 onChange={(e) => handleInputChange('instagramUsername', e.target.value)}
                                 className="w-full bg-white border border-violet-100 rounded-xl p-3 pl-7 text-xs focus:ring-2 focus:ring-violet-300 outline-none"
                               />
                             </div>
                             <button 
                               onClick={fetchInstagramProfile}
                               disabled={isFetchingIG || !localConfig.instagramUsername?.trim()}
                               className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold px-5 rounded-xl text-xs disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                             >
                               {isFetchingIG ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-download mr-1"></i> Fetch</>}
                             </button>
                          </div>
                          {igProfileResult && (
                            <p className={`text-[10px] mt-2 font-bold ${igProfileResult.startsWith('✅') ? 'text-green-600' : igProfileResult.startsWith('⚠') ? 'text-amber-600' : 'text-red-500'}`}>
                              {igProfileResult}
                            </p>
                          )}
                       </div>

                       {/* Token-based Bulk Import */}
                       <div className="p-4 bg-pink-50 rounded-2xl border-2 border-dashed border-pink-200">
                          <p className="text-[11px] text-pink-600 font-bold leading-relaxed mb-3">
                             <i className="fas fa-key mr-1"></i> <strong>API Token:</strong> Or use an Access Token to fetch your feed.
                          </p>
                          <div className="flex gap-2">
                             <input 
                               type="text" 
                               placeholder="Paste Access Token (e.g. IGQV...)"
                               value={igToken}
                               onChange={(e) => setIgToken(e.target.value)}
                               className="flex-1 bg-white border border-pink-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-pink-300 outline-none font-mono"
                             />
                             <button 
                               onClick={fetchInstagramFeed}
                               disabled={isFetchingIG}
                               className="bg-pink-500 text-white font-bold px-4 rounded-xl text-xs disabled:opacity-50"
                             >
                               {isFetchingIG ? <i className="fas fa-spinner fa-spin"></i> : 'Fetch'}
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex justify-between items-center px-1 mb-2">
               <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-widest">Memories & Links</h3>
             </div>

             {/* Drag & Drop Zone */}
             <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                   const input = document.createElement('input');
                   input.type = 'file';
                   input.multiple = true;
                   input.accept = 'image/*,video/*,audio/*';
                   input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if(files) handleMultiFileUpload(files);
                   };
                   input.click();
                }}
                className={`
                  relative group cursor-pointer transition-all duration-300
                  border-2 border-dashed rounded-3xl py-8 flex flex-col items-center justify-center gap-3 mb-6
                  ${isDraggingOver ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'}
                `}
             >
                <div className={`p-4 rounded-full transition-colors ${isDraggingOver ? 'bg-pink-100' : 'bg-gray-100 group-hover:bg-pink-50'}`}>
                   <i className={`fas fa-cloud-upload-alt text-2xl ${isDraggingOver ? 'text-pink-600' : 'text-gray-400 group-hover:text-pink-400'}`}></i>
                </div>
                <div className="text-center">
                   <p className="text-xs font-bold text-gray-600">
                      {isDraggingOver ? 'Drop files now!' : 'Click or Drag files here'}
                   </p>
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      Supports JPG, PNG, MP4, MP3
                   </p>
                </div>
             </div>
             
             {/* Gallery Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {localConfig.gallery.map((item, idx) => {
                const isIG = item.url.includes('instagram.com') || item.url.includes('cdninstagram.com');
                const isVid = isVideo(item.url);
                const isAud = isAudio(item.url);
                
                return (
                  <motion.div key={idx} layout className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 group relative aspect-[4/5] hover:shadow-md transition-shadow">
                    <div 
                      className="flex-1 w-full rounded-xl bg-gray-100 overflow-hidden relative cursor-zoom-in group/thumb"
                      onClick={() => {
                        const type = isAud ? 'audio' : isVid ? 'video' : 'image';
                        setPreviewItem({ url: item.url, type });
                      }}
                    >
                        {isAud ? (
                            <div className="absolute inset-0 flex items-center justify-center text-3xl text-orange-400">
                                <i className="fas fa-microphone"></i>
                            </div>
                        ) : isVid ? (
                            <div className="absolute inset-0 flex items-center justify-center text-3xl text-blue-400">
                                <i className="fas fa-video"></i>
                            </div>
                        ) : (
                            <img 
                              src={getPreviewUrl(item.url)} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" 
                              onError={(e) => (e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23f87171' font-size='12'%3EInvalid%3C/text%3E%3C/svg%3E")} 
                            />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
                           <i className="fas fa-search-plus text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity"></i>
                        </div>
                        {isIG && <div className="absolute inset-0 bg-pink-500/10 pointer-events-none" />}
                        {isIG && <div className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-tr from-yellow-400 to-purple-600 text-white flex items-center justify-center rounded-full text-[6px] shadow-sm"><i className="fab fa-instagram"></i></div>}
                    </div>

                    {/* Compact Controls */}
                    <div className="flex items-center gap-1.5 px-1">
                        <div className="flex-1 min-w-0">
                           {/* Privacy Toggle as a tiny dot/icon */}
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleGalleryPrivacy(idx); }}
                             className={`w-full text-xs font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${item.privacy === 'public' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}
                           >
                             <i className={`fas fa-${item.privacy === 'public' ? 'globe' : 'lock'} text-[9px]`}></i>
                             <span className="text-[9px] uppercase tracking-wider">{item.privacy === 'public' ? 'Public' : 'Private'}</span>
                           </button>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
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
              <div className="flex justify-between items-center px-1">
                 <h3 className="font-black text-gray-700 uppercase text-[11px] tracking-widest">Our Story</h3>
                 <button onClick={addTimelineEvent} className="bg-pink-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-md">+ New Event</button>
              </div>

              {/* Timeline Card Scaling */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Card Sizing (Desktop)</p>
                    <span className="text-pink-500 font-bold text-[10px]">
                       {Math.round((localConfig.timelineCardScale || 1.0) * 100)}%
                    </span>
                 </div>
                 <input 
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={localConfig.timelineCardScale || 1.0}
                    onChange={(e) => handleInputChange('timelineCardScale', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                 />
              </div>
              {localConfig.timeline.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex gap-2">
                       <DatePicker
                         selected={item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp as any)}
                         onChange={(date: Date | null) => date && handleTimelineChange(item.id, 'timestamp', date)}
                         showTimeSelect
                         dateFormat="Pp"
                         className="flex-1 text-xs border rounded-xl p-2 bg-gray-50 bg-white"
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

                    {/* Timeline Media Section */}
                    <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Attachment</label>
                          <div className="flex gap-2">
                             <button 
                                onClick={() => {
                                   const input = document.createElement('input');
                                   input.type = 'file';
                                   input.accept = 'image/*,audio/*,video/*';
                                   input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleTimelineFileUpload(item.id, file);
                                   };
                                   input.click();
                                }}
                                className="text-[8px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-all border border-blue-100"
                             >
                                <i className="fas fa-cloud-upload-alt mr-1"></i> Upload
                             </button>
                             {item.media && (
                                <button 
                                  onClick={() => handleTimelineChange(item.id, 'media', undefined)}
                                  className="text-[8px] font-black text-red-400 uppercase bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-all border border-red-100"
                                >
                                   Remove
                                </button>
                             )}
                          </div>
                       </div>

                       {item.media ? (
                          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-white">
                             {item.media.type === 'image' && (
                                <img 
                                  src={item.media.url} 
                                  className="w-12 h-12 rounded-lg object-cover border cursor-zoom-in hover:brightness-90 transition-all" 
                                  onClick={() => setPreviewItem({ url: (item.media as any).url, type: 'image' })}
                                />
                             )}
                             {item.media.type === 'audio' && (
                                <div className="flex-1 flex flex-col gap-1">
                                   <div className="flex items-center gap-2 text-[9px] font-bold text-orange-500">
                                      <i className="fas fa-microphone"></i> VOICE MEMORY
                                   </div>
                                   <audio controls src={item.media.url} className="w-full h-8 opacity-80" />
                                </div>
                             )}
                             {item.media.type === 'video' && (
                                <div 
                                  className="flex-1 flex items-center gap-2 text-[10px] font-bold text-blue-500 cursor-pointer hover:bg-blue-50 p-1 rounded-lg transition-colors"
                                  onClick={() => setPreviewItem({ url: (item.media as any).url, type: 'video' })}
                                >
                                   <i className="fas fa-video"></i> Video Milestone
                                </div>
                             )}
                          </div>
                       ) : (
                          <p className="text-[9px] text-gray-400 italic text-center py-1">No media attached to this event</p>
                       )}
                    </div>
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
              <div className="bg-pink-50/30 p-4 rounded-2xl flex items-center justify-between border border-pink-50 mb-4">
                 <div>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-2 italic">
                       <i className="fas fa-history text-pink-500"></i> Show Redeemed on Timeline
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 ml-6">Display used coupons in your story</p>
                 </div>
                 <button 
                   onClick={() => handleInputChange('showCouponsOnTimeline', !localConfig.showCouponsOnTimeline)}
                   className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${localConfig.showCouponsOnTimeline ? 'bg-pink-500 justify-end' : 'bg-gray-200 justify-start'}`}
                 >
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                 </button>
              </div>

              <div className="flex justify-between items-center px-1">
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
                         className="flex-1 border-2 border-gray-100 rounded-xl p-4 font-black text-base focus:border-purple-200 outline-none transition-all"
                       />
                    </div>
                    <input 
                      type="text" 
                      value={coupon.desc} 
                      onChange={(e) => handleCouponChange(coupon.id, 'desc', e.target.value)}
                      className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm font-bold focus:border-purple-200 outline-none transition-all"
                      placeholder="Coupon description..."
                    />
                     <div className="flex gap-2 items-center">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Points:</label>
                        <input
                           type="number"
                           min="0"
                           step="100"
                           value={coupon.points || 0}
                           onChange={(e) => handleCouponChange(coupon.id, 'points', parseInt(e.target.value))}
                           className="w-24 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:border-purple-200 outline-none transition-all"
                        />
                     </div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <select 
                            value={coupon.for} 
                            onChange={(e) => handleCouponChange(coupon.id, 'for', e.target.value)}
                            className="text-[10px] font-black border rounded-lg p-1 bg-gray-50 uppercase"
                          >
                             <option value="partner1">Her</option>
                             <option value="partner2">Him</option>
                          </select>
                          <label className="flex items-center gap-2 cursor-pointer select-none group/toggle">
                             <div 
                                onClick={() => handleCouponChange(coupon.id, 'isRedeemed', !coupon.isRedeemed)}
                                className={`w-8 h-4 rounded-full transition-all relative ${coupon.isRedeemed ? 'bg-red-500' : 'bg-gray-200'}`}
                             >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${coupon.isRedeemed ? 'left-4.5' : 'left-0.5'}`} />
                             </div>
                             <span className={`text-[9px] font-black uppercase tracking-widest ${coupon.isRedeemed ? 'text-red-500' : 'text-gray-400'}`}>
                                {coupon.isRedeemed ? 'Redeemed' : 'Unused'}
                             </span>
                          </label>
                       </div>
                       <button 
                         onClick={() => {
                            if (window.confirm("Delete this coupon?")) {
                               updateLocal(prev => ({ ...prev, coupons: prev.coupons.filter(c => c.id !== coupon.id) }));
                            }
                         }}
                         className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         title="Delete Coupon"
                       >
                          <i className="fas fa-trash-alt text-xs"></i>
                       </button>
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

      {/* FULLSCREEN PREVIEW OVERLAY */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
            onClick={() => setPreviewItem(null)}
          >
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewItem(null);
              }}
            >
              <i className="fas fa-times"></i>
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
               {previewItem.type === 'image' && (
                 <img 
                   src={getPreviewUrl(previewItem.url)} 
                   className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                   alt="Preview"
                 />
               )}
               {previewItem.type === 'video' && (
                 <video 
                   src={previewItem.url} 
                   className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                   controls
                   autoPlay
                 />
               )}
               {previewItem.type === 'audio' && (
                 <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
                    <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-4xl">
                      <i className="fas fa-microphone"></i>
                    </div>
                    <audio src={previewItem.url} controls className="w-full" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Audio Memory</p>
                 </div>
               )}
               
               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
                  <a 
                    href={previewItem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-external-link-alt"></i> Open Original
                  </a>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditDrawer;
