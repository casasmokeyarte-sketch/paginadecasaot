import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check local storage to see if already verified
    const isVerified = localStorage.getItem('ageVerified');
    if (!isVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsOpen(false);
  };

  const handleDeny = () => {
    setIsBlocked(true);
    // Optional: Redirect after a delay or just show blocked state
    setTimeout(() => {
        window.location.href = 'https://www.google.com';
    }, 2000);
  };

  if (!isOpen && !isBlocked) return null;

  return (
    <AnimatePresence>
      {(isOpen || isBlocked) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050510]/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#111322] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
          >
            {isBlocked ? (
               <div className="space-y-6">
                 <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-red-500 w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
                 <p className="text-[#a7a8c7]">
                   Lo sentimos, debes ser mayor de 18 años para acceder a este sitio.
                   <br />
                   Redirigiendo...
                 </p>
               </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-[#ff2df0]/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <ShieldCheck className="text-[#ff2df0] w-10 h-10" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verificación de Edad</h2>
                  <p className="text-[#a7a8c7] text-sm">
                    Verifica tu edad para productos de cannabis. Para continuar, por favor confirma que tienes al menos 18 años o más.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleDeny}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-[#a7a8c7] font-semibold hover:bg-white/5 hover:text-white transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={handleVerify}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] text-white font-bold hover:shadow-[0_0_20px_rgba(255,45,240,0.4)] transition-all transform hover:scale-105"
                  >
                    Sí, soy mayor
                  </button>
                </div>
                
                <p className="text-xs text-[#a7a8c7]/50 mt-4">
                  Al entrar a este sitio, aceptas nuestros términos y condiciones y política de privacidad.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerificationModal;