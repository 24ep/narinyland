"use client";

import React, { useState, useEffect, useRef } from 'react';

interface SimplePlayerProps {
  url: string;
  volume?: number;
  setVolume?: (v: number) => void;
  playing?: boolean;
  setPlaying?: (p: boolean) => void;
  muted?: boolean;
  setMuted?: (m: boolean) => void;
}

const SimplePlayer: React.FC<SimplePlayerProps> = ({ 
  url, 
  volume: controlledVolume, 
  setVolume: controlledSetVolume,
  playing: controlledPlaying,
  setPlaying: controlledSetPlaying,
  muted: controlledMuted,
  setMuted: controlledSetMuted
}) => {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalVolume, setInternalVolume] = useState(1.0);
  const [internalMuted, setInternalMuted] = useState(true);

  // Use props if provided, otherwise internal state
  const playing = controlledPlaying ?? internalPlaying;
  const setPlaying = controlledSetPlaying ?? setInternalPlaying;
  const volume = controlledVolume ?? internalVolume;
  const setVolume = controlledSetVolume ?? setInternalVolume;
  const muted = controlledMuted ?? internalMuted;
  const setMuted = controlledSetMuted ?? setInternalMuted;

  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Helper to extract YouTube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(url);

  // Send commands to YouTube IFrame
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  // Sync state with YouTube via postMessage
  useEffect(() => {
    if (playing) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [playing]);

  useEffect(() => {
    if (muted) {
      sendCommand('mute');
    } else {
      sendCommand('unMute');
      sendCommand('setVolume', [volume * 100]);
    }
  }, [muted, volume]);

  // Initial interaction handler for autoplay compliance
  useEffect(() => {
    const handleInteraction = () => {
      console.log("User interaction detected, attempting to play music unmuted...");
      setMuted(false);
      setPlaying(true);
      // Give it a tiny bit of time for the state to propagate then force unMute via command
      setTimeout(() => {
        sendCommand('unMute');
        sendCommand('setVolume', [volume * 100]);
        sendCommand('playVideo');
      }, 500);
      
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [volume]);

  if (!videoId) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {/* Hidden IFrame for Music */}
      <div style={{ position: 'fixed', top: -9999, opacity: 0.001, pointerEvents: 'none' }}>
        <iframe
          ref={iframeRef}
          width="10"
          height="10"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}`}
          title="YouTube Music Player"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>

      {error && <span className="fixed bottom-4 left-4 z-50 text-red-500 text-xs font-bold px-2 bg-white rounded-full py-1 shadow-md">Error: {error}</span>}
    </div>
  );
};

export default SimplePlayer;
