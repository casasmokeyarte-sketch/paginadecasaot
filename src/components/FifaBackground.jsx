import React, { useState, useEffect } from 'react';

const FifaBackground = ({ children, isNight = true }) => {
  const [flashes, setFlashes] = useState([]);

  useEffect(() => {
    setFlashes(Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${5 + Math.random() * 50}%`, // Stadium crowd area in the top 55%
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${4 + Math.random() * 4}s`, // Long interval between flashes
    })));
  }, []);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden text-[#eab308] bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500"
      style={{ backgroundImage: isNight ? "url('/fifa_bg.png')" : "url('/fifa_bg_day.png')" }}
    >
      <style>{`
        @keyframes crowd-camera-flash {
          0%, 97%, 100% { opacity: 0; transform: scale(0.3); }
          98.5% { opacity: 0.95; transform: scale(1.4); box-shadow: 0 0 15px 6px rgba(255, 255, 255, 0.95); }
        }
      `}</style>

      {/* Animated Golden Stadium Stars & Sparks in Background */}
      <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-500 ${isNight ? 'bg-[#020617]/50' : 'bg-[#020617]/25'}`}>
        {/* Stadium Camera Flashes */}
        {flashes.map(f => (
          <div
            key={f.id}
            className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 pointer-events-none"
            style={{
              top: f.top,
              left: f.left,
              animation: `crowd-camera-flash ${f.duration} ease-out infinite`,
              animationDelay: f.delay,
            }}
          />
        ))}

        {/* Star 1 */}
        <div className="absolute top-[10%] left-[15%] w-6 h-6 animate-pulse opacity-75">
          <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Star 2 */}
        <div className="absolute top-[25%] right-[20%] w-8 h-8 animate-pulse opacity-60 delay-300">
          <svg className="w-full h-full text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Star 3 */}
        <div className="absolute bottom-[35%] left-[25%] w-4 h-4 animate-pulse opacity-80 delay-700">
          <svg className="w-full h-full text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Star 4 */}
        <div className="absolute bottom-[15%] right-[10%] w-7 h-7 animate-pulse opacity-50 delay-500">
          <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
      </div>

      {/* Page Content wrapper */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default FifaBackground;
