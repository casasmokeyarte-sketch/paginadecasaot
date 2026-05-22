import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const LoNuevo = () => {
  const ref    = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 bg-[#050510] relative z-20 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#ff2df0]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-[#00e5ff]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4" ref={ref}>
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-[#ff2df0]" size={28} />
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5]">
              Lo <span className="text-[#ff2df0]">Nuevo</span>
            </h2>
            <Sparkles className="text-[#00e5ff]" size={28} />
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-4" />
          <p className="text-[#a7a8c7] text-lg max-w-xl mx-auto">
            Entérate de lo último en Casa Smoke y Arte
          </p>
        </motion.div>

        {/* Grid de novedades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* Tarjeta de video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-[#0d0f1f] border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-[#ff2df0]/40 transition-all group"
          >
            <div className="relative w-full aspect-video bg-black">
              <video
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                poster=""
              >
                <source src="/lo-nuevo.mp4" type="video/mp4" />
                Tu navegador no soporta video HTML5.
              </video>
            </div>
            <div className="p-5">
              <span className="text-xs font-bold text-[#ff2df0] uppercase tracking-widest">
                ✦ Novedad
              </span>
              <h3 className="text-white font-bold text-lg mt-1">
                ¡Mira lo que tenemos para ti!
              </h3>
              <p className="text-[#a7a8c7] text-sm mt-1">
                Novedades y sorpresas en Casa Smoke y Arte. ¡No te lo pierdas!
              </p>
            </div>
          </motion.div>

          {/* Tarjeta de próximas novedades */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-col gap-4"
          >
            {[
              { emoji: '🎨', titulo: 'Nuevos diseños de tatuajes', desc: 'Catálogo actualizado con los últimos estilos y tendencias del arte corporal.', color: 'from-[#ff2df0]/10 to-transparent' },
              { emoji: '🛍️', titulo: 'Productos exclusivos', desc: 'Nuevos artículos disponibles en nuestra tienda. Ediciones limitadas.', color: 'from-[#00e5ff]/10 to-transparent' },
              { emoji: '📅', titulo: 'Próximos eventos', desc: 'Talleres, exposiciones y experiencias únicas. ¡Reserva tu lugar!', color: 'from-[#a855f7]/10 to-transparent' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
                className={`bg-gradient-to-r ${item.color} border border-white/8 rounded-xl p-4 flex items-start gap-4 hover:border-white/20 transition-all`}
              >
                <span className="text-3xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.titulo}</p>
                  <p className="text-[#a7a8c7] text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LoNuevo;
