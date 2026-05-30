import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const BOLD_CART_KEY = 'bold_cart';
const BOLD_CONTEXT_KEY = 'bold_checkout_context';
const BOLD_PROCESSED_KEY = 'bold_processed_orders';

const readJsonStorage = (storage, key, fallback) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (storage, key, value) => {
  storage.setItem(key, JSON.stringify(value));
};

const toOrderItems = (cartItems = []) => cartItems.map((item) => {
  const unitPriceInCents = item.variant.sale_price_in_cents ?? item.variant.price_in_cents ?? 0;
  const unitPrice = Math.round(unitPriceInCents / 100);

  return {
    product_id: item.product?.id ?? null,
    variant_id: item.variant?.id ?? null,
    name: item.product?.title || item.product?.name || 'Producto',
    variant_name: item.variant?.title || null,
    image: item.product?.image || null,
    quantity: Number(item.quantity) || 1,
    price: unitPrice,
    line_total: unitPrice * (Number(item.quantity) || 1),
  };
});

const getOrderTotal = (orderItems = []) => orderItems.reduce((sum, item) => sum + (item.line_total || 0), 0);

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [orderSaveStatus, setOrderSaveStatus] = useState('idle');
  const [orderSaveError, setOrderSaveError] = useState('');
  const [savedOrderId, setSavedOrderId] = useState('');

  // Bold redirige con ?bold-order-id=...&bold-tx-status=approved|pending|rejected
  const orderId = params.get('bold-order-id') || '—';
  const txStatus = params.get('bold-tx-status') || 'default';
  const cartDraft = useMemo(() => readJsonStorage(sessionStorage, BOLD_CART_KEY, null), []);
  const checkoutContext = useMemo(() => readJsonStorage(sessionStorage, BOLD_CONTEXT_KEY, null), []);

  const cfg = STATUS_CONFIG[txStatus] || STATUS_CONFIG.default;
  const Icon = cfg.icon;

  useEffect(() => {
    const persistApprovedOrder = async () => {
      if (txStatus !== 'approved') {
        setOrderSaveStatus('idle');
        return;
      }

      if (!orderId || orderId === '—') {
        setOrderSaveStatus('error');
        setOrderSaveError('Bold no devolvio la referencia de pago.');
        return;
      }

      const processedOrders = readJsonStorage(localStorage, BOLD_PROCESSED_KEY, []);
      if (processedOrders.includes(orderId)) {
        setOrderSaveStatus('saved');
        return;
      }

      if (!cartDraft?.cartItems?.length) {
        setOrderSaveStatus('error');
        setOrderSaveError('No encontramos el detalle del carrito para registrar la compra.');
        return;
      }

      const items = toOrderItems(cartDraft.cartItems);
      const totalAmount = checkoutContext?.amount || getOrderTotal(items);

      setOrderSaveStatus('saving');
      setOrderSaveError('');

      try {
        const response = await fetch('/api/bold-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || null,
            items,
            totalAmount,
            paymentStatus: 'approved',
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.error || 'No se pudo registrar el pedido en el backend.');
        }

        writeJsonStorage(localStorage, BOLD_PROCESSED_KEY, [...processedOrders, orderId]);
        sessionStorage.removeItem(BOLD_CART_KEY);
        sessionStorage.removeItem(BOLD_CONTEXT_KEY);
        localStorage.removeItem('e-commerce-cart');
        setSavedOrderId(result?.id || '');
        setOrderSaveStatus('saved');
        toast({
          title: 'Pedido registrado',
          description: 'La compra ya aparece en tu historial y en el panel administrativo.',
        });
      } catch (error) {
        console.error('Error saving approved order:', error);
        setOrderSaveStatus('error');
        setOrderSaveError(error?.message || 'No se pudo registrar el pedido en la base de datos.');
      }
    };

    persistApprovedOrder();
  }, [cartDraft, checkoutContext?.amount, orderId, toast, txStatus, user?.id]);

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

          {txStatus === 'approved' && (
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm">
              {orderSaveStatus === 'saving' && (
                <p className="text-[#a7a8c7]">Registrando tu pedido en Casa Smoke y Arte...</p>
              )}
              {orderSaveStatus === 'saved' && (
                <div className="space-y-1">
                  <p className="text-green-400 font-semibold">Pedido guardado correctamente.</p>
                  <p className="text-[#a7a8c7]">Ya debe verse en tu perfil y en el panel admin.</p>
                  {savedOrderId && <p className="text-[#a7a8c7]">Registro interno: <span className="text-white font-mono">{savedOrderId}</span></p>}
                </div>
              )}
              {orderSaveStatus === 'error' && (
                <div className="space-y-1">
                  <p className="text-red-400 font-semibold">Pago aprobado, pero el pedido no quedo registrado.</p>
                  <p className="text-[#a7a8c7]">{orderSaveError}</p>
                </div>
              )}
            </div>
          )}

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
