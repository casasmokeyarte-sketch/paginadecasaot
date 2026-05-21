import React from 'react';
import { motion } from 'framer-motion';
import HomeGallery from '@/components/HomeGallery';

const Hero = () => {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050510]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-30" 
            alt="Casa Smoke y Arte fondo" 
            src="/logo2.png"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-transparent to-[#050510]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050510]/90 via-transparent to-[#050510]/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center h-full pt-20 pb-16 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }} 
              className="flex flex-col items-center space-y-8 max-w-4xl"
            >
              <motion.img 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.8, delay: 0.2 }} 
                src="/logo.png" 
                alt="Casa Smoke y Arte SSOT Logo" 
                className="w-48 md:w-64 h-auto drop-shadow-[0_0_15px_rgba(255,45,240,0.3)] mb-4 mx-auto" 
              />

              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.8, delay: 0.4 }} 
                  className="text-4xl md:text-5xl lg:text-7xl font-bold text-[#f5f5f5] leading-tight"
                >
                  CASA SMOKE Y ARTE
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.8, delay: 0.6 }} 
                  className="text-xl md:text-2xl text-[#ff2df0] font-light tracking-wide uppercase"
                >
                  CULTURA, TATTOO Y EXPERIENCIA
                </motion.p>

                <motion.p 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.8, delay: 0.8 }} 
                  className="text-base md:text-lg text-[#a7a8c7] max-w-2xl mx-auto"
                >
                  Donde el "Parche" demuestra que no es solo una pasión, viviendo la unificación de Arte, Sexshop, Smoke y tatuarse algo que cuenta tu historia.
                </motion.p>
              </div>
            </motion.div>
        </div>

      </section>
      
      {/* Gallery Showcase Section */}
      <HomeGallery />
    </>
  );
};
export default Hero;