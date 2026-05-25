import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Fondos especiales por categoría (la clave debe coincidir exactamente con el nombre en Supabase)
const CATEGORY_BACKGROUNDS = {
  'Smoke Sex':    '/images/bg-smoke-sex.png',
  'Dulce Farma':  '/images/bg-dulce-farma.png',
};
// Overlay oscuro por categoría (ajusta la opacidad según el brillo de cada imagen)
const CATEGORY_OVERLAY = {
  'Smoke Sex':   'bg-[#050510]/50',
  'Dulce Farma': 'bg-[#050510]/45',
};

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

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const cartProduct = {
      id: product.id,
      title: product.name,
      image: product.image,
      variants: [{
        id: product.id,
        title: 'Estándar',
        price_in_cents: product.price * 100,
        price_formatted: formattedPrice,
        inventory_quantity: stock,
        manage_inventory: true
      }]
    };
    
    const defaultVariant = cartProduct.variants[0];

    try {
      addToCart(cartProduct, defaultVariant, 1, stock);
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
        <Link to={`/store/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-black/20">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-50' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            
            {isOutOfStock ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Agotado
                </span>
              </div>
            ) : (
              <div className="absolute top-3 left-3 bg-[#ff2df0] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg uppercase">
                {product.category}
              </div>
            )}
            
            <div className="absolute top-3 right-3 bg-[#00e5ff]/90 text-[#050510] text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              {formattedPrice}
            </div>
          </div>
        </Link>
        
        <div className="p-5 flex flex-col flex-grow">
          <Link to={`/store/${product.id}`} className="block mb-2">
            <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-[#ff2df0] transition-colors">{product.name}</h3>
          </Link>
          
          <div className="mt-auto">
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full transition-all duration-300 ${
                isOutOfStock
                  ? 'bg-white/5 text-[#a7a8c7] border border-white/10 cursor-not-allowed opacity-60'
                  : 'bg-white/5 hover:bg-[#ff2df0] hover:text-white text-white border border-white/10 hover:border-transparent'
              }`}
            >
              {isOutOfStock
                ? 'Sin existencias'
                : <><ShoppingCart className="mr-2 h-4 w-4" /> Agregar</>}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PRICE_RANGES = [
  { label: 'Todos los precios', min: 0, max: Infinity },
  { label: 'Hasta $20.000',     min: 0, max: 20000 },
  { label: '$20.000 – $50.000', min: 20000, max: 50000 },
  { label: '$50.000 – $100.000',min: 50000, max: 100000 },
  { label: 'Más de $100.000',   min: 100000, max: Infinity },
];

const ProductsList = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm]         = useState('');
  const [priceRange, setPriceRange]         = useState(0);   // index into PRICE_RANGES
  const [showFilters, setShowFilters]       = useState(false);
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
    const range = PRICE_RANGES[priceRange];
    return products.filter(p => {
      const matchCat   = activeCategory === 'Todos' || p.category === activeCategory;
      const matchPrice = p.price >= range.min && p.price <= range.max;
      const matchText  = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchPrice && matchText;
    });
  }, [activeCategory, priceRange, searchTerm, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange(0);
    setActiveCategory('Todos');
  };

  const hasActiveFilters = searchTerm || priceRange !== 0 || activeCategory !== 'Todos';

  const categoryBg      = CATEGORY_BACKGROUNDS[activeCategory] || null;
  const categoryOverlay = CATEGORY_OVERLAY[activeCategory]     || 'bg-[#050510]/0';

  if (loadingProducts) {
    return <div className="text-center py-20 text-[#a7a8c7]">Cargando catálogo...</div>;
  }

  return (
    <div className="relative">

      {/* ── Fondo especial por categoría ── */}
      <AnimatePresence>
        {categoryBg && (
          <motion.div
            key={categoryBg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: -1 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${categoryBg})` }}
            />
            <div className={`absolute inset-0 ${categoryOverlay}`} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Barra de búsqueda + botón filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={18} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#111322] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-[#a7a8c7]/60 focus:outline-none focus:border-[#ff2df0] transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all ${
            showFilters || priceRange !== 0
              ? 'bg-[#ff2df0] border-[#ff2df0] text-white'
              : 'bg-[#111322] border-white/10 text-[#a7a8c7] hover:text-white hover:border-white/30'
          }`}
        >
          <SlidersHorizontal size={16} /> Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white inline-block" />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm text-[#a7a8c7] hover:text-white border border-white/10 hover:border-white/30 transition-all">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Panel de filtros expandible ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#111322] border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#a7a8c7] uppercase tracking-wider mb-3">Rango de precio</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={r.label}
                    onClick={() => setPriceRange(i)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      priceRange === i
                        ? 'bg-[#00e5ff] text-[#050510]'
                        : 'bg-[#15162a] text-[#a7a8c7] hover:bg-[#1a1c2e] hover:text-white border border-white/5'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filtros de categoría ── */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
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

      {/* Resultado */}
      {filteredProducts.length > 0 && hasActiveFilters && (
        <p className="text-sm text-[#a7a8c7] mb-4 text-center">
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </p>
      )}

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No hay productos que coincidan con tu búsqueda.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 text-[#ff2df0] hover:underline text-sm">
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsList;