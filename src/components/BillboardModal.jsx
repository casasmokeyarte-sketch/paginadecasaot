import React, { useState, useEffect } from 'react';

const BillboardModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the billboard in the current session
    const hasSeen = sessionStorage.getItem('hasSeenBillboard');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('hasSeenBillboard', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-5xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4 md:p-6 shadow-[0_20px_50px_rgba(244,63,94,0.3)] transform transition-all scale-100">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#ff007f] hover:bg-[#ff007f]/90 text-white font-bold text-lg shadow-lg cursor-pointer border-2 border-white transition-all hover:scale-110 active:scale-95 z-50"
          aria-label="Cerrar publicidad"
        >
          ✕
        </button>

        {/* Canva Embed */}
        <div className="w-full">
          <div 
            className="relative w-full h-0 overflow-hidden rounded-xl shadow-inner border border-white/10"
            style={{ 
              paddingTop: '25.7732%', 
              paddingBottom: 0, 
              boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', 
              willChange: 'transform' 
            }}
          >
            <iframe 
              loading="lazy" 
              className="absolute inset-0 w-full h-full border-none p-0 m-0"
              src="https://www.canva.com/design/DAHMQYYvFVg/4rdW-_EqlTFROkHG8hOZ0g/watch?embed" 
              allowFullScreen="allowfullscreen" 
              allow="fullscreen"
              title="Canva Banner Ad"
            />
          </div>
          <div className="mt-3 text-center text-xs text-white/80 font-medium tracking-wide">
            <a 
              href="https://www.canva.com/design/DAHMQYYvFVg/4rdW-_EqlTFROkHG8hOZ0g/watch?utm_content=DAHMQYYvFVg&amp;utm_campaign=designshare&amp;utm_medium=embeds&amp;utm_source=link" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline text-[#ffd600] font-bold"
            >
              Publicidad
            </a>{' '}
            de Oliver Torres
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillboardModal;
