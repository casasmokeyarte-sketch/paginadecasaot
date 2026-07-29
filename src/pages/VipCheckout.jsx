import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const BOLD_LIB = 'https://checkout.bold.co/library/boldPaymentButton.js';

const VipCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState(null);
  const applicationId = useMemo(
    () => location.state?.applicationId || sessionStorage.getItem('vip_application_id'),
    [location.state?.applicationId]
  );

  useEffect(() => {
    if (!applicationId || !session?.access_token) {
      setError('No encontramos una solicitud preparada para pago.');
      setStatus('error');
      return;
    }

    fetch('/api/vip-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ applicationId }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'No se pudo preparar el pago.');
        setCheckout(data);
        sessionStorage.setItem('vip_payment_order_id', data.orderId);
        setStatus('ready');
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('error');
      });

    return () => document.getElementById('bold-vip-button')?.remove();
  }, [applicationId, session?.access_token]);

  useEffect(() => {
    if (status !== 'ready' || !checkout) return;
    const container = document.getElementById('bold-vip-container');
    if (!container) return;
    container.innerHTML = '';
    document.getElementById('bold-vip-button')?.remove();

    const script = document.createElement('script');
    script.id = 'bold-vip-button';
    script.src = BOLD_LIB;
    script.setAttribute('data-bold-button', 'dark-L');
    script.setAttribute('data-api-key', checkout.apiKey);
    script.setAttribute('data-amount', String(checkout.amount));
    script.setAttribute('data-currency', 'COP');
    script.setAttribute('data-order-id', checkout.orderId);
    script.setAttribute('data-integrity-signature', checkout.hash);
    script.setAttribute('data-description', 'Membresía mensual Casa VIP');
    script.setAttribute(
      'data-redirection-url',
      `${window.location.origin}/vip/pago/resultado?application=${checkout.applicationId}`
    );
    script.setAttribute('data-render-mode', 'embedded');
    script.onerror = () => {
      setError('No se pudo cargar la plataforma de pago Bold.');
      setStatus('error');
    };
    container.appendChild(script);
  }, [checkout, status]);

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-yellow-300/20 bg-[#0d0f1f] p-8 text-center shadow-2xl">
        <Crown className="mx-auto text-yellow-300" size={45} />
        <h1 className="mt-4 text-2xl font-black">Pago de membresía Casa VIP</h1>
        <p className="mt-2 text-[#a7a8c7]">
          Pago único del primer mes. La activación se realiza después de revisar la solicitud.
        </p>

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-12 text-[#a7a8c7]">
            <Loader2 className="animate-spin" /> Preparando pago seguro...
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
            <AlertCircle className="mx-auto text-red-300" />
            <p className="mt-3 text-red-100">{error}</p>
            <button
              onClick={() => navigate('/user/vip/apply')}
              className="mt-5 rounded-xl border border-white/15 px-5 py-3 font-bold"
            >
              Volver a la solicitud
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-8">
            <p className="text-4xl font-black text-yellow-300">
              ${Number(checkout.amount).toLocaleString('es-CO')}
            </p>
            <p className="mt-1 text-sm text-[#8185a3]">COP · primer periodo mensual</p>
            <div id="bold-vip-container" className="mt-7 flex min-h-[58px] justify-center" />
          </div>
        )}

        <div className="mt-8 flex items-start gap-2 rounded-xl bg-white/5 p-4 text-left text-xs text-[#a7a8c7]">
          <ShieldCheck className="mt-0.5 flex-none text-green-300" size={17} />
          La web verificará el pago directamente con Bold antes de registrar la solicitud.
        </div>
      </div>
    </div>
  );
};

export default VipCheckout;
