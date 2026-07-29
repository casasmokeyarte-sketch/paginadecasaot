import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const VipPaymentResult = () => {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Confirmando el pago directamente con Bold...');
  const applicationId = params.get('application') || sessionStorage.getItem('vip_application_id');
  const orderId = params.get('bold-order-id') || sessionStorage.getItem('vip_payment_order_id');

  const verifyPayment = useCallback(async () => {
    if (!session?.access_token || !applicationId || !orderId) {
      setStatus('error');
      setMessage('No encontramos la referencia necesaria para verificar el pago.');
      return;
    }

    setStatus('checking');
    setMessage('Confirmando el pago directamente con Bold...');
    try {
      const response = await fetch('/api/vip-payment-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ applicationId, orderId }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.status === 'approved') {
        sessionStorage.removeItem('vip_application_id');
        sessionStorage.removeItem('vip_payment_order_id');
        setStatus('approved');
        setMessage('Pago confirmado. Tu solicitud ya está en revisión administrativa.');
        return;
      }

      if (response.status === 202 || data.status === 'pending') {
        setStatus('pending');
        setMessage(data.message || 'El pago todavía está en proceso.');
        return;
      }

      setStatus('error');
      setMessage(data.error || data.message || 'El pago no pudo ser confirmado.');
    } catch (error) {
      setStatus('pending');
      setMessage(error?.message || 'No fue posible consultar el pago en este momento.');
    }
  }, [applicationId, orderId, session?.access_token]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const config = {
    checking: [Loader2, 'text-cyan-300', 'Verificando pago'],
    approved: [CheckCircle2, 'text-green-300', 'Solicitud enviada'],
    pending: [Clock3, 'text-yellow-300', 'Pago pendiente'],
    error: [XCircle, 'text-red-300', 'No se confirmó el pago'],
  }[status];
  const [Icon, color, title] = config;

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#0d0f1f] p-9 text-center">
        <Icon className={`mx-auto ${color} ${status === 'checking' ? 'animate-spin' : ''}`} size={52} />
        <h1 className={`mt-5 text-2xl font-black ${color}`}>{title}</h1>
        <p className="mt-3 text-[#a7a8c7]">{message}</p>

        <div className="mt-7 flex flex-col gap-3">
          {status === 'pending' && (
            <button
              onClick={verifyPayment}
              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-black text-[#0b0710]"
            >
              <RefreshCw size={18} /> Verificar nuevamente
            </button>
          )}
          {status === 'approved' && (
            <Link to="/user/vip" className="rounded-xl bg-green-400 px-5 py-3 font-black text-[#07100a]">
              Ver mi solicitud VIP
            </Link>
          )}
          {status === 'error' && (
            <Link to="/user/vip" className="rounded-xl border border-white/15 px-5 py-3 font-bold">
              Volver a Casa VIP
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VipPaymentResult;
