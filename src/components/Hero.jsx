import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import HomeGallery from '@/components/HomeGallery';

// Programmatic helper to generate perfect starburst seal points
const getStarburstPoints = (cx, cy, spikes, outerRadius, innerRadius) => {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;
  let points = [];

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    points.push(`${x},${y}`);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    points.push(`${x},${y}`);
    rot += step;
  }
  return points.join(' ');
};

const Hero = () => {
  const starburstPoints = getStarburstPoints(50, 50, 18, 48, 40);

  return (
    <>
      <Helmet>
        {/* Load script fonts for script-styled headers */}
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Playball&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>Casa Smoke y Arte SSOT S.A.S - Pride Month Especial 🏳️‍🌈</title>
      </Helmet>

      <div className="container mx-auto px-4 pt-8 pb-16 font-sans flex flex-col items-center relative overflow-visible">
        {/* Background logo2 watermark (Original cover image preserved) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
          <img src="/logo2.png" alt="Logo Watermark" className="w-[80%] max-w-xl h-auto object-contain" />
        </div>
        
        {/* Main Brand Logo */}
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.8 }} 
          src="/logo.png" 
          alt="Casa Smoke y Arte Logo" 
          className="w-32 md:w-44 h-auto mb-2 drop-shadow-md select-none pointer-events-none relative z-10" 
        />

        {/* Top Header cursive title */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-center font-normal text-5xl md:text-7xl pb-8 text-[#4a248c] tracking-wide relative z-10"
          style={{ fontFamily: "'Playball', cursive" }}
        >
          Casa Smoke y Arte OT SSOT S.A.S
        </motion.h1>

        {/* Pride Banner Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-6xl mx-auto rounded-3xl p-8 md:p-12 overflow-visible bg-gradient-to-r from-pink-300/40 via-purple-300/40 to-blue-300/40 backdrop-blur-lg border border-white/50 shadow-[0_10px_30px_rgba(244,63,94,0.15)] min-h-[240px] md:min-h-[320px] flex items-center mb-8"
        >
          {/* Banner sparkle backgrounds */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-60">
            <div className="absolute top-[20%] left-[40%] w-4 h-4 bg-white rounded-full blur-[2px] animate-pulse"></div>
            <div className="absolute bottom-[25%] left-[10%] w-3 h-3 bg-white rounded-full blur-[1px] animate-ping"></div>
            <div className="absolute top-[15%] right-[25%] w-5 h-5 bg-white rounded-full blur-[2px] animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full relative z-10">
            {/* Left side: Starburst badge */}
            <div className="col-span-1 md:col-span-4 flex justify-center md:justify-end">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                className="relative cursor-pointer"
              >
                <svg viewBox="0 0 100 100" className="w-32 h-32 md:w-44 md:h-44 drop-shadow-[0_6px_12px_rgba(202,138,4,0.35)]">
                  <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fff2a3" />
                      <stop offset="40%" stopColor="#facc15" />
                      <stop offset="85%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#854d0e" />
                    </linearGradient>
                  </defs>
                  <polygon points={starburstPoints} fill="url(#gold-gradient)" />
                  <text 
                    x="50" 
                    y="55" 
                    textAnchor="middle" 
                    fill="#4a248c" 
                    className="font-bold text-base md:text-lg italic"
                    style={{ fontFamily: "'Playball', cursive" }}
                    transform="rotate(-15 50 50)"
                  >
                    Especial
                  </text>
                </svg>
              </motion.div>
            </div>

            {/* Middle: Mes Pride text */}
            <div className="col-span-1 md:col-span-5 text-center md:text-left flex flex-col justify-center items-center md:items-start select-none pt-2 md:pt-0">
              <motion.span 
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-purple-600 block mb-1 drop-shadow-sm"
                style={{ fontFamily: "'Playball', cursive" }}
              >
                Mes
              </motion.span>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full flex justify-center md:justify-start overflow-visible h-[90px] md:h-[110px]"
              >
                <svg viewBox="0 0 240 100" className="w-[200px] md:w-[260px] overflow-visible select-none">
                  <defs>
                    <linearGradient id="pride-rainbow-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff3333" />
                      <stop offset="20%" stopColor="#ff8c00" />
                      <stop offset="40%" stopColor="#ffd700" />
                      <stop offset="60%" stopColor="#32cd32" />
                      <stop offset="80%" stopColor="#1e90ff" />
                      <stop offset="100%" stopColor="#8a2be2" />
                    </linearGradient>
                    <filter id="pride-blue-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="5" stdDeviation="0" floodColor="#1a237e" floodOpacity="0.9" />
                    </filter>
                  </defs>
                  <text
                    x="50%"
                    y="76"
                    textAnchor="middle"
                    fill="white"
                    stroke="url(#pride-rainbow-stroke)"
                    strokeWidth="9"
                    paintOrder="stroke fill"
                    filter="url(#pride-blue-shadow)"
                    fontSize="78"
                    style={{ fontFamily: "'Pacifico', cursive" }}
                  >
                    Pride
                  </text>
                </svg>
              </motion.div>
            </div>

            {/* Spacing for overlapping flamingo */}
            <div className="col-span-1 md:col-span-3"></div>
          </div>

          {/* Overlapping Pride Flamingo */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.5 }}
            className="absolute -right-6 sm:-right-10 md:-right-16 lg:-right-24 -top-16 sm:-top-24 md:-top-36 lg:-top-44 w-48 sm:w-64 md:w-[24rem] lg:w-[29rem] xl:w-[32rem] h-[125%] sm:h-[135%] md:h-[155%] lg:h-[170%] pointer-events-auto select-none z-20"
          >
            <img 
              src="/pride_flamingo.png" 
              alt="Pride Flamingo" 
              className="w-full h-full object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-98 transition-transform duration-300 cursor-pointer"
            />
          </motion.div>
        </motion.div>

        {/* Nuestras Zonas (HomeGallery) */}
        <HomeGallery />

        {/* Nuestros Valores Section */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white/40 border border-white/50 backdrop-blur-md p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] select-none">
          {/* Section title */}
          <h4 
            className="text-center text-4xl md:text-5xl text-[#ff007f] font-normal mb-8"
            style={{ fontFamily: "'Playball', cursive" }}
          >
            Nuestros Valores:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Colaboracion */}
            <div className="col-span-1 md:col-span-4 text-center md:text-right">
              <h5 
                className="text-2xl text-[#4a248c] font-bold mb-3 italic"
                style={{ fontFamily: "'Playball', cursive" }}
              >
                Colaboración
              </h5>
              <p className="text-sm text-[#4a248c]/80 leading-relaxed font-medium">
                En nuestra colaboración, combinamos el arte y la comunidad para crecer juntos y compartir experiencias únicas.
              </p>
            </div>

            {/* Middle: creation of adam hands */}
            <div className="col-span-1 md:col-span-4 flex justify-center py-4 md:py-0">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-44 h-24 md:w-56 md:h-32"
              >
                <img 
                  src="/pride_hands.png" 
                  alt="Manos con diseño Pride"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(74,36,140,0.15)]"
                />
              </motion.div>
            </div>

            {/* Right Column: Orgullo */}
            <div className="col-span-1 md:col-span-4 text-center md:text-left">
              <h5 
                className="text-2xl text-[#4a248c] font-bold mb-3 italic"
                style={{ fontFamily: "'Playball', cursive" }}
              >
                Orgullo
              </h5>
              <p className="text-sm text-[#4a248c]/80 leading-relaxed font-medium">
                Comunidad y orgullo en la búsqueda de la diversidad, construyendo identidad y fuerza colectiva.
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Hero;