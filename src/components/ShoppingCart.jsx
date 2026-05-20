import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const { toast } = useToast();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Tu carrito está vacío',
        description: 'Agrega productos antes de pagar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const items = cartItems.map(item => ({
        title: item.product.title + (item.variant.title ? ` - ${item.variant.title}` : ''),
        quantity: item.quantity,
        unit_price: Math.round((item.variant.sale_price_in_cents ?? item.variant.price_in_cents) / 100),
      }));

      const successUrl = `${window.location.origin}/success`;
      const cancelUrl = window.location.href;

      const res = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, successUrl, cancelUrl }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al crear el pago');

      clearCart();
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: 'Error de pago',
        description: error.message || 'Hubo un problema al iniciar el pago. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  }, [cartItems, clearCart, toast]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0a0a16] border-l border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#050510]">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="text-[#ff2df0]" size={24} />
                <h2 className="text-2xl font-bold text-white">Carrito</h2>
              </div>
              <Button onClick={() => setIsCartOpen(false)} variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                <X size={24} />
              </Button>
            </div>

            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                    <ShoppingCartIcon size={40} className="text-white/20" />
                  </div>
                  <p className="text-lg">Tu carrito está vacío.</p>
                  <Button 
                    onClick={() => setIsCartOpen(false)}
                    variant="link" 
                    className="text-[#ff2df0] hover:text-[#d91cb8]"
                  >
                    Continuar comprando
                  </Button>
                </div>
              ) : (
                cartItems.map(item => (
                  <motion.div 
                    layout
                    key={item.variant.id} 
                    className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
                      <img 
                        src={item.product.image} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-white line-clamp-1">{item.product.title}</h3>
                        <p className="text-sm text-gray-400">{item.variant.title}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[#00e5ff] font-bold">
                          {item.variant.sale_price_formatted || item.variant.price_formatted}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-black/30 rounded-lg border border-white/10">
                            <button 
                              onClick={() => updateQuantity(item.variant.id, Math.max(1, item.quantity - 1))}
                              className="p-1.5 hover:text-[#ff2df0] transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                              className="p-1.5 hover:text-[#ff2df0] transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.variant.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-[#050510] border-t border-white/10 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-gray-400">Total</span>
                  <span className="text-3xl font-bold text-white">{getCartTotal()}</span>
                </div>
                <Button 
                  onClick={handleCheckout} 
                  className="w-full bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] hover:shadow-[0_0_20px_rgba(255,45,240,0.4)] text-white font-bold py-6 text-lg rounded-xl transition-all"
                >
                  Pagar Ahora
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;