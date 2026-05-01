import React from 'react';
import { motion } from 'framer-motion';
import ProductsList from '@/components/ProductsList';

const Shop = () => {
  return (
    <section className="min-h-screen pt-32 pb-20 bg-[#050510]">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#f5f5f5] mb-4">
            Catálogo y <span className="text-[#ff2df0]">Tienda</span>
          </h1>
          <p className="text-xl text-[#a7a8c7] max-w-2xl mx-auto">
            Explora todos nuestros productos, insumos y accesorios en un solo lugar. 
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] mx-auto mt-6"></div>
        </motion.div>

        <ProductsList />
      </div>
    </section>
  );
};

export default Shop;