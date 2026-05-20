import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { galleryImages } from '@/data/galleryImages';

const ZoneCard = ({ image, index }) => {
  const cardBase =
    'relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg transition-all h-[250px] flex flex-col items-center justify-center p-6';

  // Tarjeta "MUY PRONTO" — imagen turbia, no navega
  if (image.proximamente) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`${cardBase} bg-black select-none`}
      >
        {image.src && (
          <img
            src={image.src}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="text-4xl">⭐</span>
          <p className="text-white text-2xl font-black tracking-widest uppercase drop-shadow-lg">
            {image.alt}
          </p>
          <span className="mt-2 px-4 py-1 rounded-full bg-yellow-400 text-black font-extrabold text-lg tracking-widest shadow-lg">
            MUY PRONTO
          </span>
        </div>
      </motion.div>
    );
  }

  // Tarjeta "En Remodelación"
  if (image.renovacion) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`${cardBase} bg-gradient-to-br ${image.gradient} select-none opacity-70`}
      >
        <span className="text-5xl mb-3">{image.icon}</span>
        <p className="text-white text-lg font-bold text-center">{image.alt.split(' - ')[0]}</p>
        <span className="mt-3 px-3 py-1 rounded-full border border-yellow-400 text-yellow-400 text-sm font-bold tracking-wide">
          🔧 En Remodelación
        </span>
      </motion.div>
    );
  }

  // Tarjeta normal — con imagen o con gradiente
  return (
    <Link to={image.link}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.05, y: -10 }}
        className={`${cardBase} hover:shadow-[#ff2df0]/20 ${image.src ? 'bg-black' : `bg-gradient-to-br ${image.gradient}`}`}
      >
        {image.src ? (
          <img
            src={image.src}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <>
            <span className="text-6xl mb-4 drop-shadow-lg select-none">{image.icon}</span>
            <p className="text-white text-xl font-bold text-center leading-tight drop-shadow">
              {image.alt.split(' - ')[0]}
            </p>
            <p className="text-white/60 text-sm mt-1 text-center">{image.alt.split(' - ')[1]}</p>
          </>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <p className="text-[#ff2df0] text-xl font-bold uppercase tracking-widest">
              {image.alt.split(' - ')[0]}
            </p>
            <span className="text-white text-sm mt-2 inline-block border-b border-[#00e5ff] pb-1">
              Ver Sección
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const HomeGallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

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
            <ZoneCard key={image.id || index} image={image} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeGallery;

export default HomeGallery;