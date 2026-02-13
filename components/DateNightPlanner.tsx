
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

const VIBES = ['Cozy 🧸', 'Fancy 🥂', 'Adventurous 🎒', 'Chill 🍿', 'Spicy 🌶️'];
const CUISINES = ['Italian 🍝', 'Japanese 🍣', 'Mexican 🌮', 'Street Food 🌭', 'Surprise Me 🎲'];
const BUDGETS = ['Cheap & Cheerful $', 'Moderate $$', 'Splurge $$$'];

const DateNightPlanner: React.FC = () => {
  const [locationName, setLocationName] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [vibe, setVibe] = useState(VIBES[0]);
  const [cuisine, setCuisine] = useState(CUISINES[0]);
  const [budget, setBudget] = useState(BUDGETS[1]);
  
  const [plan, setPlan] = useState<string | null>(null);
  const [mapPlaces, setMapPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUseLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName("Current Location 📍");
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please type it in manually! 🗺️");
          setIsLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const generateDate = async () => {
    if (!locationName && !userLocation) {
      alert("Please enter a location or use the 'My Location' button! 🗺️");
      return;
    }

    setIsLoading(true);
    setPlan(null);
    setMapPlaces([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Configuration for Google Maps Grounding
      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      // If we have precise coordinates, pass them to the tool config
      if (userLocation) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.lat,
              longitude: userLocation.lng
            }
          }
        };
      }

      const promptLocation = userLocation ? "my current location" : locationName;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Must use 2.5-flash for Maps Grounding
        contents: `Plan a romantic date night for a couple.
        
        Preferences:
        - Search Near: ${promptLocation}
        - Vibe: ${vibe}
        - Cuisine: ${cuisine}
        - Budget: ${budget}
        
        Task:
        1. Find 2-3 SPECIFIC, REAL places (restaurants, activities) using Google Maps.
        2. Write a short, enthusiastic itinerary explaining why these spots are perfect for this date.
        3. Do NOT include generic advice. Only mention real places found on the map.`,
        config: config
      });

      if (response.text) {
        setPlan(response.text.trim());
      }
      
      // Extract Google Maps Grounding Metadata
      // This contains the real navigation links and place details
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        // Filter for chunks that have map data
        const places = chunks.filter((c: any) => c.maps);
        setMapPlaces(places);
      }

    } catch (error) {
      console.error("Error generating date plan:", error);
      setPlan("Nari lost the map! 🗺️💔 Please try again or type a specific city name.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h2 className="font-pacifico text-3xl text-pink-500 mb-2">Date Night Planner 🌙</h2>
        <p className="text-gray-500 font-quicksand">Nari uses Google Maps to find real spots for you!</p>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-white relative z-20">
        
        {/* Controls */}
        <div className="space-y-6">
          
          {/* Location Input */}
          <div>
            <label className="block text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">
              Where should we go?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => {
                    setLocationName(e.target.value);
                    setUserLocation(null); // Reset precise location if typing manually
                  }}
                  placeholder="City, Zip, or 'Current Location'"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:outline-none bg-white/80 text-gray-700 font-quicksand placeholder-pink-200"
                />
                <i className="fas fa-map-marker-alt absolute left-3.5 top-3.5 text-pink-300 text-lg"></i>
              </div>
              
              <button
                onClick={handleUseLocation}
                title="Use My Location"
                className="bg-pink-100 hover:bg-pink-200 text-pink-600 px-4 rounded-xl transition-colors border-2 border-pink-200"
              >
                <i className="fas fa-location-crosshairs"></i>
              </button>
            </div>
            {userLocation && (
              <p className="text-xs text-green-600 mt-2 font-bold ml-2">
                <i className="fas fa-check-circle"></i> Using precise GPS location
              </p>
            )}
          </div>

          {/* Vibe Selection */}
          <div>
            <label className="block text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">Pick a Vibe</label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    vibe === v 
                    ? 'bg-pink-500 text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-100'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Selection */}
          <div>
            <label className="block text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">Craving</label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCuisine(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    cuisine === c 
                    ? 'bg-blue-400 text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-blue-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Selection */}
          <div>
            <label className="block text-pink-400 font-bold text-sm uppercase tracking-wider mb-3">Budget</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    budget === b
                    ? 'bg-green-400 text-white shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 hover:bg-green-50 border border-green-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateDate}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed z-10 relative"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Scouting Locations...
                </>
              ) : (
                <>
                  <i className="fas fa-search-location"></i> Find Date Spots!
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Result Area */}
        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#2a1b3d] text-white p-6 rounded-xl relative overflow-hidden shadow-inner">
                {/* Starry Background Effect */}
                <div className="absolute inset-0 opacity-20">
                   {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute bg-white rounded-full w-1 h-1"
                        style={{ 
                          top: `${Math.random() * 100}%`, 
                          left: `${Math.random() * 100}%`,
                          opacity: Math.random()
                        }}
                      />
                   ))}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
                    <span className="text-2xl">🌙</span>
                    <h3 className="font-pacifico text-xl text-yellow-300">Your Magical Itinerary</h3>
                  </div>
                  
                  <div className="prose prose-invert prose-sm max-w-none font-quicksand leading-relaxed whitespace-pre-line mb-6">
                    {plan}
                  </div>

                  {/* Google Maps Places Cards */}
                  {mapPlaces.length > 0 && (
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Navigate To 📍</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mapPlaces.map((chunk, i) => {
                          const mapData = chunk.maps;
                          if (!mapData || !mapData.uri) return null;
                          
                          return (
                            <a
                              key={i}
                              href={mapData.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block bg-white/10 hover:bg-white/20 transition-all border border-white/10 rounded-lg p-3 relative overflow-hidden"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-bold text-sm text-blue-200 group-hover:text-blue-100 truncate pr-2">
                                    {mapData.title}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    Tap to open in Google Maps
                                  </p>
                                </div>
                                <div className="bg-blue-500/20 p-2 rounded-full text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                  <i className="fas fa-directions"></i>
                                </div>
                              </div>
                              
                              {/* Rating/Snippet if available */}
                              {mapData.placeAnswerSources?.reviewSnippets?.[0] && (
                                <div className="mt-2 text-[10px] text-gray-300 italic border-l-2 border-white/20 pl-2 line-clamp-2">
                                  "{mapData.placeAnswerSources.reviewSnippets[0].text}"
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DateNightPlanner;
