import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ShoppingCart, Minus, Plus, Tag, Package, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=1200';

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function StoreProductDetail() {
  const { productId } = useParams();
  const { products, loadingProducts, fetchProducts } = useSupabaseData();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
    window.scrollTo(0, 0);
  }, [productId]);

  const product = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && String(p.id) !== String(productId))
      .slice(0, 8);
  }, [products, product, productId]);

  const handleAddToCart = () => {
    if (!product) return;
    const cartProduct = {
      id: product.id,
      title: product.name,
      image: product.image,
      variants: [{
        id: product.id,
        title: 'Estándar',
        price_in_cents: product.price * 100,
        price_formatted: formatCOP(product.price),
        inventory_quantity: 99,
        manage_inventory: false,
      }],
    };
    addToCart(cartProduct, cartProduct.variants[0], quantity, 99);
    toast({
      title: '¡Agregado al carrito! 🛒',
      description: `${quantity} × ${product.name} agregado.`,
    });
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-[#ff2df0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#050510] pt-32 px-4 text-center">
        <p className="text-[#a7a8c7] text-xl mb-6">Producto no encontrado.</p>
        <Link to="/store" className="inline-flex items-center gap-2 text-[#ff2df0] hover:underline font-semibold">
          <ArrowLeft size={18} /> Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} – Casa Smoke y Arte</title>
        <meta name="description" content={product.description || product.name} />
      </Helmet>

      <div className="min-h-screen bg-[#050510] pt-28 pb-24 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#a7a8c7] mb-8">
            <Link to="/store" className="hover:text-[#ff2df0] transition-colors flex items-center gap-1">
              <ArrowLeft size={16} /> Tienda
            </Link>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-[#ff2df0] font-medium">{product.category}</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-white truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">

            {/* ── Imagen ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square bg-[#111322] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={product.image || FALLBACK_IMAGE}
                  alt={product.name}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="w-full h-full object-cover"
                />
                {/* Category badge */}
                <div className="absolute top-5 left-5 bg-[#ff2df0] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  {product.category}
                </div>
              </div>
            </motion.div>

            {/* ── Info ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#111322] border border-white/10 text-[#a7a8c7] px-3 py-1 rounded-full">
                    <Tag size={12} /> {product.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#111322] border border-white/10 text-[#00e5ff] px-3 py-1 rounded-full">
                    <Package size={12} /> Disponible
                  </span>
                </div>
              </div>

              {/* Precio */}
              <div className="flex items-baseline gap-3 py-4 border-y border-white/10">
                <span className="text-5xl font-extrabold text-[#00e5ff]">
                  {formatCOP(product.price)}
                </span>
              </div>

              {/* Descripción */}
              {product.description ? (
                <div className="bg-[#111322] rounded-2xl p-5 border border-white/5">
                  <h3 className="text-sm font-bold text-[#a7a8c7] uppercase tracking-wider mb-3">Descripción</h3>
                  <p className="text-[#d0d1e6] leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              ) : (
                <div className="bg-[#111322] rounded-2xl p-5 border border-white/5">
                  <h3 className="text-sm font-bold text-[#a7a8c7] uppercase tracking-wider mb-2">Descripción</h3>
                  <p className="text-[#a7a8c7] italic text-sm">
                    Producto de calidad de Casa Smoke y Arte. Contáctanos para más información sobre este artículo.
                  </p>
                </div>
              )}

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111322] rounded-xl p-4 border border-white/5 text-center">
                  <Star size={18} className="text-[#feca57] mx-auto mb-1" />
                  <p className="text-xs text-[#a7a8c7]">Calidad</p>
                  <p className="text-white font-bold text-sm">Garantizada</p>
                </div>
                <div className="bg-[#111322] rounded-xl p-4 border border-white/5 text-center">
                  <Package size={18} className="text-[#00e5ff] mx-auto mb-1" />
                  <p className="text-xs text-[#a7a8c7]">Entrega</p>
                  <p className="text-white font-bold text-sm">En tienda / Domicilio</p>
                </div>
              </div>

              {/* Cantidad + Carrito */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex items-center gap-2 bg-[#111322] border border-white/10 rounded-full px-2 py-1 w-max">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[#ff2df0] transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-xl font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[#ff2df0] transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-grow h-14 bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] hover:shadow-[0_0_25px_rgba(255,45,240,0.45)] text-white font-bold text-lg rounded-full transition-all"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Agregar al Carrito
                </Button>
              </div>

              <p className="text-xs text-[#a7a8c7] text-center">
                Total: <span className="text-white font-bold">{formatCOP(product.price * quantity)}</span>
              </p>
            </motion.div>
          </div>

          {/* ── Productos relacionados ── */}
          {relatedProducts.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-bold text-white">Más de <span className="text-[#ff2df0]">{product.category}</span></h2>
                <div className="flex-grow h-px bg-white/10" />
                <Link
                  to={`/store`}
                  className="text-sm text-[#00e5ff] hover:underline whitespace-nowrap"
                >
                  Ver todo →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {relatedProducts.map((rel, i) => (
                  <motion.div
                    key={rel.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    <Link
                      to={`/store/${rel.id}`}
                      className="group block bg-[#111322] rounded-2xl overflow-hidden border border-white/5 hover:border-[#ff2df0]/40 hover:shadow-[0_0_18px_rgba(255,45,240,0.12)] transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-black/20">
                        <img
                          src={rel.image || FALLBACK_IMAGE}
                          alt={rel.name}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-white text-sm font-semibold line-clamp-2 group-hover:text-[#ff2df0] transition-colors mb-1">
                          {rel.name}
                        </p>
                        <p className="text-[#00e5ff] font-bold text-sm">{formatCOP(rel.price)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
