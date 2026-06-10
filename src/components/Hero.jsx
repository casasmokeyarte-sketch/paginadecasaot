import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';

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

            {/* Middle: Day Pride text */}
            <div className="col-span-1 md:col-span-5 text-center md:text-left flex flex-col justify-center select-none pt-2 md:pt-0">
              <motion.span 
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-purple-600 block mb-1 drop-shadow-sm"
                style={{ fontFamily: "'Playball', cursive" }}
              >
                Day
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-6xl md:text-8xl font-black tracking-wider text-white select-none leading-none"
                style={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: '-3px -3px 0 #4a248c, 3px -3px 0 #4a248c, -3px 3px 0 #4a248c, 3px 3px 0 #4a248c, 0 8px 25px rgba(74,36,140,0.3)'
                }}
              >
                Pride
              </motion.h2>
            </div>

            {/* Spacing for overlapping flamingo */}
            <div className="col-span-1 md:col-span-3"></div>
          </div>

          {/* Overlapping Pride Flamingo */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.5 }}
            className="absolute -right-4 md:-right-12 -top-12 md:-top-20 w-44 sm:w-56 md:w-80 h-[115%] md:h-[130%] pointer-events-none select-none z-20"
          >
            <img 
              src="/pride_flamingo.png" 
              alt="Pride Flamingo" 
              className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.2)]"
            />
          </motion.div>
        </motion.div>

        {/* Local Navigation Bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 max-w-2xl mx-auto border-y border-[#4a248c]/15 text-[#4a248c] mb-12 select-none">
          <Link to="/" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Inicio</Link>
          <Link to="/store" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Arte</Link>
          <Link to="/store" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Smoke</Link>
          <Link to="/booking" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Eventos</Link>
          <Link to="/about" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Sobre Nosotros</Link>
          <Link to="/contact" className="text-base font-bold uppercase hover:text-[#ff007f] transition-colors">Contacto</Link>
        </div>

        {/* Featured Products Heading */}
        <div className="text-center mb-10 select-none">
          <h3 
            className="text-3xl md:text-4xl font-extrabold tracking-widest text-[#4a248c] uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Featured Products
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Polaroid Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto mb-20 px-4">
          {[
            { title: "The Creative Spark", img: "/creative_spark.png", link: "/store" },
            { title: "Smoke in the Rainbow", img: "/smoke_rainbow.png", link: "/store" },
            { title: "OT SSOT SAS Collection", img: "/ot_ssot_collection.png", link: "/store" }
          ].map((prod, index) => (
            <motion.div
              key={prod.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-white p-4 pb-8 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-gray-100/80 rounded-sm"
            >
              {/* Product Image Wrapper */}
              <Link to={prod.link} className="block overflow-hidden bg-gray-50 border border-gray-200/40 rounded-sm">
                <img 
                  src={prod.img} 
                  alt={prod.title}
                  className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
                />
              </Link>
              {/* Polaroid Product Title */}
              <p 
                className="text-center text-[#4a248c] text-xl mt-5 font-bold tracking-wide"
                style={{ fontFamily: "'Playball', cursive" }}
              >
                {prod.title}
              </p>

              {/* Overlapping Rainbow Feather */}
              <div className="absolute -bottom-4 -right-4 w-12 h-12 pointer-events-none select-none z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full transform rotate-12">
                  <defs>
                    <linearGradient id={`rainbow-feather-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff4b5c" />
                      <stop offset="20%" stopColor="#ff8f56" />
                      <stop offset="40%" stopColor="#ffdf6d" />
                      <stop offset="60%" stopColor="#48e285" />
                      <stop offset="80%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M2 22C2 22 5 18 11 16.5C17 15 21 11.5 21 7.5C21 3.5 18.5 1.5 16.5 1.5C14.5 1.5 11 5 10 10.5C9 16 2 22 2 22Z" 
                    fill={`url(#rainbow-feather-grad-${index})`} 
                  />
                  <path d="M10 16.5C10 16.5 12.5 13.5 15.5 10.5C18.5 7.5 21 7.5 21 7.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

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