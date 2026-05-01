import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const SuccessPage = () => {
  const { clearCart } = useCart();

  useEffect(() => {
    // Ensure cart is cleared on success page load just in case
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-[#111322] border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff]" />
        
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
          className="w-24 h-24 bg-[#00e5ff]/20 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="text-[#00e5ff] w-12 h-12" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">¡Pago Exitoso!</h1>
        <p className="text-[#a7a8c7] text-lg mb-8">
          Gracias por tu compra. Hemos recibido tu pedido y te enviaremos un correo de confirmación en breve.
        </p>

        <div className="flex flex-col gap-4">
          <Link to="/store">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} />
              Volver a la Tienda
            </motion.button>
          </Link>
          
          <Link to="/">
            <button className="w-full py-4 text-[#a7a8c7] hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
              Ir al Inicio <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;