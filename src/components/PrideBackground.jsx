import React from 'react';

const PrideBackground = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#ffe4e6] via-[#f3e8ff] to-[#e0f2fe] text-[#4a248c] transition-colors duration-500">
      {/* Animated Sparkles & Twinkles in Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sparkle 1 */}
        <div className="absolute top-[10%] left-[15%] w-6 h-6 animate-pulse opacity-75">
          <svg className="w-full h-full text-[#ffd600]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Sparkle 2 */}
        <div className="absolute top-[25%] right-[20%] w-8 h-8 animate-pulse opacity-60 delay-300">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Sparkle 3 */}
        <div className="absolute bottom-[35%] left-[25%] w-4 h-4 animate-pulse opacity-80 delay-700">
          <svg className="w-full h-full text-[#ff66cc]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>
        {/* Sparkle 4 */}
        <div className="absolute bottom-[15%] right-[10%] w-7 h-7 animate-pulse opacity-50 delay-500">
          <svg className="w-full h-full text-[#00e5ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>

        {/* Slow Drifting Cloud 1 */}
        <div className="absolute top-[8%] -left-[10%] w-72 h-36 opacity-30 blur-sm pointer-events-none animate-drift-slow bg-white rounded-full"></div>
        {/* Slow Drifting Cloud 2 */}
        <div className="absolute top-[45%] -right-[15%] w-96 h-48 opacity-25 blur-md pointer-events-none animate-drift-slower bg-[#ffdcf0] rounded-full"></div>
        {/* Slow Drifting Cloud 3 */}
        <div className="absolute bottom-[10%] -left-[5%] w-80 h-40 opacity-40 blur-sm pointer-events-none animate-drift-slow-reverse bg-white rounded-full"></div>
      </div>

      <style>{`
        @keyframes drift {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(50px) scale(1.05); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes drift-slow {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(100px) scale(1.1); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes drift-reverse {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(-80px) scale(1.05); }
          100% { transform: translateX(0) scale(1); }
        }
        .animate-drift-slow {
          animation: drift-slow 25s ease-in-out infinite;
        }
        .animate-drift-slower {
          animation: drift 35s ease-in-out infinite;
        }
        .animate-drift-slow-reverse {
          animation: drift-reverse 30s ease-in-out infinite;
        }
      `}</style>

      {/* Page Content wrapper */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default PrideBackground;
