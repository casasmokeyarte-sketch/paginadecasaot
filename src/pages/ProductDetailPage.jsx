import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct, getProductQuantities } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Loader2, ArrowLeft, CheckCircle, Minus, Plus, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjAyMDIwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback(async () => {
    if (product && selectedVariant) {
      const availableQuantity = selectedVariant.inventory_quantity;
      try {
        await addToCart(product, selectedVariant, quantity, availableQuantity);
        toast({
          title: "¡Agregado al Carrito! 🛒",
          description: `${quantity} x ${product.title} (${selectedVariant.title}) agregado.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "¡Oh no! Algo salió mal.",
          description: error.message,
        });
      }
    }
  }, [product, selectedVariant, quantity, addToCart, toast]);

  const handleQuantityChange = useCallback((amount) => {
    setQuantity(prevQuantity => {
        const newQuantity = prevQuantity + amount;
        if (newQuantity < 1) return 1;
        return newQuantity;
    });
  }, []);

  const handlePrevImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
    }
  }, [product?.images?.length]);

  const handleNextImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1);
    }
  }, [product?.images?.length]);

  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);

    if (variant.image_url && product?.images?.length > 0) {
      const imageIndex = product.images.findIndex(image => image.url === variant.image_url);

      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  }, [product?.images]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProduct = await getProduct(id);

        try {
          const quantitiesResponse = await getProductQuantities({
            fields: 'inventory_quantity',
            product_ids: [fetchedProduct.id]
          });

          const variantQuantityMap = new Map();
          quantitiesResponse.variants.forEach(variant => {
            variantQuantityMap.set(variant.id, variant.inventory_quantity);
          });

          const productWithQuantities = {
            ...fetchedProduct,
            variants: fetchedProduct.variants.map(variant => ({
              ...variant,
              inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity
            }))
          };

          setProduct(productWithQuantities);

          if (productWithQuantities.variants && productWithQuantities.variants.length > 0) {
            setSelectedVariant(productWithQuantities.variants[0]);
          }
        } catch (quantityError) {
          throw quantityError;
        }
      } catch (err) {
        setError(err.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] bg-[#050510]">
        <Loader2 className="h-16 w-16 text-[#ff2df0] animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#050510] pt-32 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/store" className="inline-flex items-center gap-2 text-[#a7a8c7] hover:text-[#ff2df0] transition-colors mb-6">
            <ArrowLeft size={16} />
            Volver a la Tienda
          </Link>
          <div className="text-center text-red-400 p-8 bg-white/5 rounded-2xl border border-red-500/20">
            <XCircle className="mx-auto h-16 w-16 mb-4" />
            <p className="mb-6">Error cargando producto: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const price = selectedVariant?.sale_price_formatted ?? selectedVariant?.price_formatted;
  const originalPrice = selectedVariant?.price_formatted;
  const availableStock = selectedVariant ? selectedVariant.inventory_quantity : 0;
  const isStockManaged = selectedVariant?.manage_inventory ?? false;
  const canAddToCart = !isStockManaged || quantity <= availableStock;

  const currentImage = product.images[currentImageIndex];
  const hasMultipleImages = product.images.length > 1;

  return (
    <>
      <Helmet>
        <title>{product.title} - Casa Smoke y Arte</title>
        <meta name="description" content={product.description?.substring(0, 160) || product.title} />
      </Helmet>
      <div className="min-h-screen bg-[#050510] pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/store" className="inline-flex items-center gap-2 text-[#a7a8c7] hover:text-[#ff2df0] transition-colors mb-8">
            <ArrowLeft size={20} />
            Volver a la Tienda
          </Link>
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Image Section */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
              <div className="relative aspect-square bg-[#111322] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={!currentImage?.url ? placeholderImage : currentImage.url}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff2df0] text-white p-3 rounded-full transition-all backdrop-blur-sm"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#ff2df0] text-white p-3 rounded-full transition-all backdrop-blur-sm"
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {product.ribbon_text && (
                  <div className="absolute top-6 left-6 bg-[#ff2df0] text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                    {product.ribbon_text}
                  </div>
                )}
              </div>

              {hasMultipleImages && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-[#ff2df0] scale-105' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={!image.url ? placeholderImage : image.url}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Info Section */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{product.title}</h1>
              <p className="text-xl text-[#a7a8c7] mb-8 font-light">{product.subtitle}</p>

              <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-white/10">
                <span className="text-5xl font-bold text-[#00e5ff]">{price}</span>
                {selectedVariant?.sale_price_in_cents && (
                  <span className="text-3xl text-gray-500 line-through decoration-red-500/50">{originalPrice}</span>
                )}
              </div>

              <div className="prose prose-invert max-w-none text-[#a7a8c7] mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />

              <div className="space-y-6 flex-grow">
                {product.variants.length > 1 && (
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Estilo / Variedad</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map(variant => (
                        <Button
                          key={variant.id}
                          variant="outline"
                          onClick={() => handleVariantSelect(variant)}
                          className={`h-auto py-3 px-6 text-base transition-all ${
                            selectedVariant?.id === variant.id 
                            ? 'bg-[#ff2df0] border-[#ff2df0] text-white' 
                            : 'border-white/20 text-white bg-transparent hover:bg-white/10'
                          }`}
                        >
                          {variant.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <div className="flex items-center border-2 border-white/10 rounded-full p-1 w-max">
                    <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-full h-10 w-10 text-white hover:bg-white/10 hover:text-[#ff2df0]"><Minus size={18} /></Button>
                    <span className="w-12 text-center text-xl font-bold text-white">{quantity}</span>
                    <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-full h-10 w-10 text-white hover:bg-white/10 hover:text-[#ff2df0]"><Plus size={18} /></Button>
                  </div>
                  
                  <Button 
                    onClick={handleAddToCart} 
                    size="lg" 
                    className="flex-grow h-14 bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] hover:shadow-[0_0_20px_rgba(255,45,240,0.4)] text-white font-bold text-lg rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={!canAddToCart || !product.purchasable}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> Agregar al Carrito
                  </Button>
                </div>

                {isStockManaged && canAddToCart && product.purchasable && (
                  <p className="text-sm text-[#00e5ff] flex items-center gap-2 font-medium">
                    <CheckCircle size={16} /> {availableStock} disponibles
                  </p>
                )}

                {isStockManaged && !canAddToCart && product.purchasable && (
                   <p className="text-sm text-yellow-500 flex items-center gap-2 font-medium">
                    <XCircle size={16} /> Stock insuficiente. Solo quedan {availableStock}.
                  </p>
                )}

                {!product.purchasable && (
                    <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                      <XCircle size={16} /> Actualmente no disponible
                    </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;