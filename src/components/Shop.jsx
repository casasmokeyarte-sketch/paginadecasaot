import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductsList from '@/components/ProductsList';

const CATEGORY_BACKGROUNDS = {
  'Smoke Sex':   '/images/bg-smoke-sex.png',
  'Dulce Farma': '/images/bg-dulce-farma.png',
};

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const categoryBg = CATEGORY_BACKGROUNDS[activeCategory] || null;

  return (
    <section className="min-h-screen pt-32 pb-20 bg-transparent relative overflow-hidden">

      {/* ── Fondo de categoría animado ── */}
      <AnimatePresence>
        {categoryBg && (
          <motion.div
            key={categoryBg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
              style={{ backgroundImage: `url(${categoryBg})` }}
            />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 relative" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#4a248c] mb-4">
            Catálogo y <span className="text-[#ff007f]">Tienda</span>
          </h1>
          <p className="text-xl text-[#4a248c]/80 max-w-2xl mx-auto">
            Explora todos nuestros productos, insumos y accesorios en un solo lugar.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mx-auto mt-6 rounded-full" />
        </motion.div>

        <ProductsList
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </div>
    </section>
  );
};

export default Shop;