import React, { useState, useEffect } from 'react';

const CasaSmokeBackground = ({ children, isNight = true }) => {
  const [sparkles, setSparkles] = useState([]);
  const [feathers, setFeathers] = useState([]);

  useEffect(() => {
    // Generate twinkling sparkles
    setSparkles(
      Array.from({ length: 35 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 4 + 2}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 4}s`,
      }))
    );

    // Generate floating ambient light feathers/smoke particles
    setFeathers(
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 90}%`,
        size: `${Math.random() * 60 + 30}px`,
        delay: `${Math.random() * 7}s`,
        duration: `${10 + Math.random() * 10}s`,
        opacity: Math.random() * 0.4 + 0.2,
      }))
    );
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-700"
      style={{
        backgroundImage: "url('/casa_smoke_bg.jpg')",
        backgroundColor: '#05020a',
      }}
    >
      {/* Background keyframe animations */}
      <style>{`
        @keyframes gentle-float {
          0% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0.2; }
          50% { transform: translateY(-40px) rotate(10deg) scale(1.1); opacity: 0.6; }
          100% { transform: translateY(-80px) rotate(-5deg) scale(1); opacity: 0.2; }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.5); }
          50% { opacity: 0.9; transform: scale(1.3); box-shadow: 0 0 12px 3px rgba(244, 114, 182, 0.8); }
        }
        @keyframes smoke-pulse {
          0%, 100% { opacity: 0.25; filter: blur(30px); }
          50% { opacity: 0.45; filter: blur(45px); }
        }
      `}</style>

      {/* Dynamic Overlay & Animated Floating Particles */}
      <div
        className={`absolute inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-700 ${
          isNight ? 'bg-black/40 backdrop-brightness-[0.85]' : 'bg-black/20'
        }`}
      >
        {/* Ambient Smoke Glow Blobs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 bg-pink-600/20 rounded-full animate-pulse"
          style={{ animation: 'smoke-pulse 8s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full animate-pulse"
          style={{ animation: 'smoke-pulse 11s ease-in-out infinite 2s' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-96 h-96 bg-rose-500/20 rounded-full animate-pulse"
          style={{ animation: 'smoke-pulse 9s ease-in-out infinite 4s' }}
        />

        {/* Floating Feather / Sparkle Particles */}
        {feathers.map((f) => (
          <div
            key={`feather-${f.id}`}
            className="absolute rounded-full bg-gradient-to-tr from-pink-400/30 via-purple-300/40 to-white/60 blur-[3px] pointer-events-none"
            style={{
              bottom: '-100px',
              left: f.left,
              width: f.size,
              height: f.size,
              animation: `gentle-float ${f.duration} ease-in-out infinite`,
              animationDelay: f.delay,
              opacity: f.opacity,
            }}
          />
        ))}

        {/* Twinkling Glitter Particles */}
        {sparkles.map((s) => (
          <div
            key={`sparkle-${s.id}`}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animation: `sparkle-twinkle ${s.duration} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default CasaSmokeBackground;
