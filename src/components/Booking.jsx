import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Booking = () => {
  return (
    <>
      <Helmet>
        <title>Citas Tattoo - Casa Smoke y Arte</title>
      </Helmet>
      <section className="min-h-screen bg-[#050510] flex items-center justify-center py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center mb-8">
              <motion.div
                animate={{ rotate: [0, -15, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="p-5 bg-[#111322] rounded-2xl border border-[#ff2df0]/30"
              >
                <Wrench className="text-[#ff2df0]" size={52} />
              </motion.div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              En Reconstrucción
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>

            <p className="text-lg text-[#a7a8c7] mb-4">
              Nuestra sección de citas de tatuaje está siendo renovada para ofrecerte una mejor experiencia.
            </p>

            <div className="flex items-center justify-center gap-2 text-[#00e5ff] font-semibold">
              <Clock size={20} />
              <span>Vuelve pronto, estará lista muy pronto.</span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Booking;
