import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BOLD_LIB = 'https://checkout.bold.co/library/boldPaymentButton.js';

const BoldCheckout = () => {
  const navigate   = useNavigate();
  const [status, setStatus]   = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Recuperar datos del carrito guardados por ShoppingCart
    const raw = sessionStorage.getItem('bold_cart');
    if (!raw) {
      setErrorMsg('No hay productos en el carrito.');
      setStatus('error');
      return;
    }

    const { cartItems } = JSON.parse(raw);

    const prepare = async () => {
      try {
        const res  = await fetch('/api/bold-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error preparando el pago');

        injectBold(data);
        setStatus('ready');
      } catch (err) {
        setErrorMsg(err.message);
        setStatus('error');
      }
    };

    prepare();

    // Limpiar script de Bold al desmontar
    return () => {
      document.getElementById('bold-lib-script')?.remove();
    };
  }, []);

  const injectBold = ({ orderId, amount, hash, apiKey }) => {
    // 1. Librería principal de Bold (solo si no existe)
    if (!document.getElementById('bold-lib-script')) {
      const lib    = document.createElement('script');
      lib.id       = 'bold-lib-script';
      lib.src      = BOLD_LIB;
      document.head.appendChild(lib);
    }

    // 2. Script del botón con todos los atributos
    const btn = document.createElement('script');
    btn.setAttribute('data-bold-button',         '');
    btn.setAttribute('data-api-key',             apiKey);
    btn.setAttribute('data-amount',              String(amount));
    btn.setAttribute('data-currency',            'COP');
    btn.setAttribute('data-order-id',            orderId);
    btn.setAttribute('data-integrity-signature', hash);
    btn.setAttribute('data-description',         'Compra en Casa Smoke y Arte');
    btn.setAttribute('data-redirection-url',     `${window.location.origin}/pago/resultado`);
    btn.setAttribute('data-render-mode',         'embedded');
    btn.setAttribute('data-bold-button',         'dark-L');

    const container = document.getElementById('bold-btn-container');
    if (container) container.appendChild(btn);
  };

  return (
    <>
      <Helmet>
        <title>Pago seguro - Casa Smoke y Arte</title>
      </Helmet>

      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md bg-[#0d0f1f] border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#ff2df0]/10 flex items-center justify-center">
              <ShoppingCart className="text-[#ff2df0]" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Finalizar compra</h1>
              <p className="text-sm text-[#a7a8c7]">Pago seguro con Bold</p>
            </div>
          </div>

          {/* Estado: cargando */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="text-[#ff2df0] animate-spin" size={40} />
              <p className="text-[#a7a8c7]">Preparando tu pago...</p>
            </div>
          )}

          {/* Estado: error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <AlertCircle className="text-red-400" size={40} />
              <p className="text-white font-semibold">No se pudo preparar el pago</p>
              <p className="text-[#a7a8c7] text-sm">{errorMsg}</p>
              <Button
                onClick={() => navigate('/store')}
                className="mt-2 bg-[#ff2df0] hover:bg-[#d91cb8] text-white rounded-xl"
              >
                Volver a la tienda
              </Button>
            </div>
          )}

          {/* Estado: listo — Bold inyecta el botón aquí */}
          {status === 'ready' && (
            <div className="flex flex-col items-center gap-6">
              <p className="text-[#a7a8c7] text-sm text-center">
                Haz clic en el botón para completar tu pago de forma segura.<br/>
                Acepta tarjetas, PSE, Nequi y más.
              </p>

              {/* Bold inserta el botón de pago en este div */}
              <div id="bold-btn-container" className="w-full flex justify-center" />

              <button
                onClick={() => navigate('/store')}
                className="text-sm text-[#a7a8c7] hover:text-white transition-colors mt-2"
              >
                ← Volver a la tienda
              </button>
            </div>
          )}

          {/* Logos de medios de pago */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-[#a7a8c7]/60">Pago procesado de forma segura por</p>
            <p className="text-sm font-bold text-white/70 mt-1">Bold.co</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoldCheckout;
