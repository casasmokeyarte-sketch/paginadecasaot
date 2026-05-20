import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=1200';

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(product.price);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cartProduct = {
      id: product.id,
      title: product.name,
      image: product.image,
      variants: [{
        id: product.id,
        title: 'Estándar',
        price_in_cents: product.price * 100,
        price_formatted: formattedPrice,
        inventory_quantity: 99,
        manage_inventory: false
      }]
    };
    
    const defaultVariant = cartProduct.variants[0];

    try {
      addToCart(cartProduct, defaultVariant, 1, 99);
      toast({
        title: "¡Agregado al carrito! 🛒",
        description: `${product.name} se ha agregado a tu carrito.`,
      });
    } catch (error) {
      toast({
        title: "Error al agregar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="h-full rounded-2xl border border-white/10 bg-[#111322] overflow-hidden group hover:border-[#ff2df0]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,45,240,0.15)] flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-black/20">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050510] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
          
          <div className="absolute top-3 left-3 bg-[#ff2df0] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg uppercase">
            {product.category}
          </div>
          
          <div className="absolute top-3 right-3 bg-[#00e5ff]/90 text-[#050510] text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            {formattedPrice}
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#ff2df0] transition-colors">{product.name}</h3>
          
          <div className="mt-auto">
            <Button 
              onClick={handleAddToCart} 
              className="w-full bg-white/5 hover:bg-[#ff2df0] hover:text-white text-white border border-white/10 hover:border-transparent transition-all duration-300"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductsList = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { products, loadingProducts, fetchProducts } = useSupabaseData();

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    if (!products || products.length === 0) return ['Todos'];
    return ['Todos', ...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === 'Todos') return products;
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  if (loadingProducts) {
    return <div className="text-center py-20 text-[#a7a8c7]">Cargando catálogo...</div>;
  }

  return (
    <div>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === category
                ? 'bg-[#ff2df0] text-white shadow-[0_0_15px_rgba(255,45,240,0.4)]'
                : 'bg-[#15162a] text-[#a7a8c7] hover:bg-[#1a1c2e] hover:text-white border border-white/5'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No hay productos disponibles por el momento.</p>
        </div>
      )}
    </div>
  );
};

export default ProductsList;