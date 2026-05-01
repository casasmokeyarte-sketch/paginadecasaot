import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { galleryImages } from '@/data/galleryImages';

const HomeGallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-20 bg-[#050510] relative z-20">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Nuestras <span className="text-[#ff2df0]">Zonas</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Explora cada rincón de nuestra casa. Haz clic en tu zona favorita.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <Link to={image.link} key={image.id || index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer bg-[#111322] shadow-lg hover:shadow-[#ff2df0]/20 transition-all h-[250px] flex items-center justify-center p-6"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                   <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-[#ff2df0] text-xl font-bold uppercase tracking-widest">{image.alt.split('-')[0]}</p>
                      <span className="text-white text-sm mt-2 inline-block border-b border-[#00e5ff] pb-1">Ver Sección</span>
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeGallery;