import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const PLAYLIST = [
  '/gaga-pokerface.mp3',
  '/gaga-paparazzi.mp3'
];

const PrideAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35; // comfortable background volume
    }
  }, []);

  // Sync player source on track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[currentTrackIndex];
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play()
          .catch(err => console.log("Playback interrupted or blocked:", err));
      }
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Audio playback blocked by browser policies:", err);
          alert("Por favor interactúa con la página primero para habilitar el reproductor.");
        });
    }
  };

  const handleTrackEnded = () => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-3 rounded-full border border-[#ff66cc]/30 shadow-[0_4px_20px_rgba(255,102,204,0.3)] hover:scale-105 transition-transform duration-300">
      {/* Background Audio Tag */}
      <audio
        ref={audioRef}
        onEnded={handleTrackEnded}
        preload="auto"
      />

      {/* Visualizer animation when playing */}
      <div className="flex items-end gap-0.5 h-6 w-8 px-1">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 bg-gradient-to-t from-[#ff66cc] to-[#3b82f6] rounded-full transition-all duration-300 ${
              isPlaying ? `animate-wave-bar-${bar}` : 'h-1.5'
            }`}
          />
        ))}
      </div>

      {/* Play/Mute Button */}
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#ff007f] via-[#ff66cc] to-[#ff00ff] text-white shadow-[0_0_10px_rgba(255,0,127,0.4)] hover:shadow-[0_0_18px_rgba(255,0,127,0.7)] transition-all duration-300 focus:outline-none"
        title={isPlaying ? "Silenciar música" : "Escuchar Mix de Lady Gaga 🏳️‍🌈"}
      >
        {isPlaying ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
      </button>

      {/* Interactive label */}
      <span className="text-xs font-black tracking-wider text-[#4a248c] hidden md:block">
        {isPlaying ? 'GAGA MIX' : 'PLAY LADY GAGA'}
      </span>

      <style>{`
        @keyframes wave-1 {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
        @keyframes wave-2 {
          0%, 100% { height: 10px; }
          50% { height: 20px; }
        }
        @keyframes wave-3 {
          0%, 100% { height: 8px; }
          50% { height: 26px; }
        }
        @keyframes wave-4 {
          0%, 100% { height: 12px; }
          50% { height: 18px; }
        }
        @keyframes wave-5 {
          0%, 100% { height: 5px; }
          50% { height: 22px; }
        }
        .animate-wave-bar-1 { animation: wave-1 0.6s ease-in-out infinite alternate; }
        .animate-wave-bar-2 { animation: wave-2 0.8s ease-in-out infinite alternate; }
        .animate-wave-bar-3 { animation: wave-3 0.7s ease-in-out infinite alternate; }
        .animate-wave-bar-4 { animation: wave-4 0.9s ease-in-out infinite alternate; }
        .animate-wave-bar-5 { animation: wave-5 0.5s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

export default PrideAudioPlayer;
