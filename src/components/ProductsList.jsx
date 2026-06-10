import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, SlidersHorizontal, X } from 'lucide-react';
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
      <div className="h-full rounded-2xl border border-[#ff66cc]/20 bg-white/80 backdrop-blur-sm overflow-hidden group hover:border-[#ff007f]/50 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(255,102,204,0.2)] flex flex-col">
        <Link to={`/store/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-black/5">
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-50' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            
            {isOutOfStock ? (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Agotado
                </span>
              </div>
            ) : (
              <div className="absolute top-3 left-3 bg-[#ff007f] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg uppercase">
                {product.category}
              </div>
            )}
            
            <div className="absolute top-3 right-3 bg-white/90 text-[#4a248c] text-xs font-extrabold px-3 py-1 rounded-full shadow-md border border-[#ff66cc]/10">
              {formattedPrice}
            </div>
          </div>
        </Link>
        
        <div className="p-5 flex flex-col flex-grow">
          <Link to={`/store/${product.id}`} className="block mb-2">
            <h3 className="text-lg font-bold text-[#4a248c] line-clamp-1 group-hover:text-[#ff007f] transition-colors">{product.name}</h3>
          </Link>
          
          <div className="mt-auto">
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full transition-all duration-300 font-bold ${
                isOutOfStock
                  ? 'bg-black/5 text-[#4a248c]/50 border border-black/10 cursor-not-allowed opacity-60'
                  : 'bg-[#4a248c]/15 hover:bg-[#ff007f] hover:text-white text-[#4a248c] border border-[#ff66cc]/30 hover:border-transparent'
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

const ProductsList = ({ activeCategory: propCategory, setActiveCategory: propSetCategory }) => {
  const [internalCategory, setInternalCategory] = useState('Todos');
  const activeCategory    = propCategory     !== undefined ? propCategory     : internalCategory;
  const setActiveCategory = propSetCategory  !== undefined ? propSetCategory  : setInternalCategory;
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

  if (loadingProducts) {
    return <div className="text-center py-20 text-[#4a248c] font-semibold">Cargando catálogo...</div>;
  }

  return (
    <div>
      {/* ── Barra de búsqueda + botón filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a248c]/60" size={18} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/80 border border-[#ff66cc]/20 rounded-xl py-3 pl-11 pr-4 text-[#4a248c] placeholder:text-[#4a248c]/50 focus:outline-none focus:border-[#ff007f] transition-colors shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a248c]/60 hover:text-[#ff007f]">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-sm transition-all ${
            showFilters || priceRange !== 0
              ? 'bg-[#ff007f] border-[#ff007f] text-white shadow-md'
              : 'bg-white/80 border-[#ff66cc]/20 text-[#4a248c] hover:text-[#ff007f] hover:border-[#ff007f]/50 shadow-sm'
          }`}
        >
          <SlidersHorizontal size={16} /> Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold text-[#4a248c] hover:text-[#ff007f] border border-[#ff66cc]/20 hover:border-[#ff007f]/50 bg-white/60 transition-all">
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
            <div className="bg-white/80 border border-[#ff66cc]/20 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-black text-[#4a248c] uppercase tracking-wider mb-3">Rango de precio</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={r.label}
                    onClick={() => setPriceRange(i)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      priceRange === i
                        ? 'bg-[#ff007f] text-white shadow-md'
                        : 'bg-white/50 text-[#4a248c]/70 hover:bg-pink-50 hover:text-[#ff007f] border border-[#ff66cc]/20'
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
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeCategory === category
                ? 'bg-[#ff007f] text-white shadow-[0_4px_15px_rgba(255,0,127,0.25)]'
                : 'bg-white/60 text-[#4a248c] hover:bg-pink-50 hover:text-[#ff007f] border border-[#ff66cc]/20'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Resultado */}
      {filteredProducts.length > 0 && hasActiveFilters && (
        <p className="text-sm text-[#4a248c]/80 mb-4 text-center font-semibold">
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