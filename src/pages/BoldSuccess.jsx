import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  approved: {
    icon:  CheckCircle2,
    color: 'text-green-400',
    bg:    'bg-green-400/10',
    title: '¡Pago aprobado!',
    desc:  'Tu compra se procesó correctamente. Pronto recibirás confirmación.',
  },
  pending: {
    icon:  Clock,
    color: 'text-yellow-400',
    bg:    'bg-yellow-400/10',
    title: 'Pago pendiente',
    desc:  'Tu pago está en proceso. Te notificaremos cuando se confirme.',
  },
  rejected: {
    icon:  XCircle,
    color: 'text-red-400',
    bg:    'bg-red-400/10',
    title: 'Pago rechazado',
    desc:  'No se pudo completar el pago. Intenta de nuevo con otro método.',
  },
  default: {
    icon:  Clock,
    color: 'text-[#a7a8c7]',
    bg:    'bg-white/5',
    title: 'Estado del pago',
    desc:  'Verifica el estado de tu transacción.',
  },
};

const BoldSuccess = () => {
  const [params] = useSearchParams();

  // Bold redirige con ?bold-order-id=...&bold-tx-status=approved|pending|rejected
  const orderId = params.get('bold-order-id') || '—';
  const txStatus = params.get('bold-tx-status') || 'default';

  const cfg = STATUS_CONFIG[txStatus] || STATUS_CONFIG.default;
  const Icon = cfg.icon;

  // Limpiar carrito de sessionStorage si el pago fue aprobado
  useEffect(() => {
    if (txStatus === 'approved') {
      sessionStorage.removeItem('bold_cart');
    }
  }, [txStatus]);

  return (
    <>
      <Helmet>
        <title>Resultado del pago - Casa Smoke y Arte</title>
      </Helmet>

      <div className="min-h-screen bg-[#050510] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-[#0d0f1f] border border-white/10 rounded-2xl p-10 text-center shadow-2xl"
        >
          {/* Icono de estado */}
          <div className={`w-20 h-20 rounded-full ${cfg.bg} flex items-center justify-center mx-auto mb-6`}>
            <Icon className={cfg.color} size={42} />
          </div>

          <h1 className={`text-2xl font-bold mb-3 ${cfg.color}`}>{cfg.title}</h1>
          <p className="text-[#a7a8c7] mb-6">{cfg.desc}</p>

          {/* Referencia de la orden */}
          <div className="bg-white/5 rounded-xl px-5 py-3 mb-8 text-sm">
            <span className="text-[#a7a8c7]">Referencia de pago: </span>
            <span className="text-white font-mono font-semibold">{orderId}</span>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            {txStatus !== 'approved' && (
              <Button
                asChild
                className="bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] text-white font-bold rounded-xl py-5"
              >
                <Link to="/store">
                  <ShoppingBag size={18} className="mr-2" />
                  Intentar de nuevo
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 rounded-xl py-5"
            >
              <Link to="/">
                <Home size={18} className="mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          <p className="text-xs text-[#a7a8c7]/40 mt-8">Pago procesado por Bold.co</p>
        </motion.div>
      </div>
    </>
  );
};

export default BoldSuccess;
