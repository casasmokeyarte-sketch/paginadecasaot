import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { productsData } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart } from 'lucide-react';

const TattooCatalog = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Group products by category
  const categories = [...new Set(productsData.map(p => p.category))];

  const handleAddToCart = (product) => {
    const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(product.price);

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
        title: "¡Agregado! 🛒",
        description: `${product.name} agregado al carrito.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section id="catalog" className="py-20 bg-[#050510]">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Catálogo Completo
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Explora nuestra lista detallada de productos disponibles por categoría.
          </p>
        </motion.div>

        <div className="space-y-16">
          {categories.map((category, catIndex) => {
            const categoryProducts = productsData.filter(p => p.category === category);
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#ff2df0] border-l-4 border-[#00e5ff] pl-4">
                    {category}
                  </h3>
                  <div className="h-[1px] bg-white/10 flex-grow"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="bg-[#111322] border border-white/5 rounded-xl p-4 flex gap-4 hover:border-[#ff2df0]/30 transition-colors group"
                    >
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-grow">
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                          <p className="text-[#00e5ff] font-bold text-sm">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="self-end mt-2 text-xs flex items-center gap-1 text-[#a7a8c7] hover:text-[#ff2df0] transition-colors"
                        >
                          <ShoppingCart size={14} /> Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TattooCatalog;