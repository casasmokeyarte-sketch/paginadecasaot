import { createClient } from '@supabase/supabase-js';

const getBearerToken = (req) => {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
};

const normalizeBoldStatus = (payload) =>
  String(
    payload?.payment_status
    || payload?.status
    || payload?.payload?.payment_status
    || payload?.payload?.status
    || ''
  ).toUpperCase();

const normalizeBoldAmount = (payload) =>
  Number(
    payload?.total
    ?? payload?.amount
    ?? payload?.payload?.total
    ?? payload?.payload?.amount
    ?? 0
  );

const paymentMethodForDatabase = (value) => {
  const method = String(value || '').toUpperCase();
  if (method.includes('NEQUI')) return 'nequi';
  if (method.includes('PSE')) return 'pse';
  return 'card';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.BOLD_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://igvmfhpnjcdbamtijjzo.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Falta configurar Bold o Supabase en Vercel.' });
  }

  const accessToken = getBearerToken(req);
  const applicationId = String(req.body?.applicationId || '');
  const returnedOrderId = String(req.body?.orderId || '');
  if (!accessToken || !applicationId || !returnedOrderId) {
    return res.status(401).json({ error: 'Sesión o referencia no válida.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData?.user) {
    return res.status(401).json({ error: 'La sesión venció. Inicia sesión nuevamente.' });
  }

  const { data: application, error: applicationError } = await supabase
    .from('vip_applications')
    .select('*, vip_plans(id, monthly_price)')
    .eq('id', applicationId)
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (applicationError || !application) {
    return res.status(404).json({ error: 'No encontramos la solicitud VIP.' });
  }

  if (application.payment_order_id !== returnedOrderId) {
    return res.status(400).json({ error: 'La referencia no corresponde a esta solicitud.' });
  }

  if (application.payment_status === 'approved' && application.status === 'under_review') {
    return res.status(200).json({ status: 'approved', alreadyProcessed: true });
  }

  let boldResponse;
  try {
    const response = await fetch(
      `https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(returnedOrderId)}`,
      {
        headers: { Authorization: `x-api-key ${apiKey}` },
        signal: AbortSignal.timeout(12000),
      }
    );
    boldResponse = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(202).json({
        status: 'pending',
        message: 'Bold todavía no refleja la transacción. Intenta verificar nuevamente en unos minutos.',
      });
    }
  } catch {
    return res.status(202).json({
      status: 'pending',
      message: 'No fue posible consultar a Bold en este momento.',
    });
  }

  const boldStatus = normalizeBoldStatus(boldResponse);
  const approved = ['APPROVED', 'SALE_APPROVED'].includes(boldStatus);
  const pending = ['PENDING', 'PROCESSING', 'NO_TRANSACTION_FOUND', ''].includes(boldStatus);

  if (!approved) {
    await supabase
      .from('vip_applications')
      .update({
        payment_status: pending ? 'pending' : 'rejected',
        status: pending ? 'payment_pending' : 'draft',
      })
      .eq('id', application.id);

    return res.status(pending ? 202 : 402).json({
      status: pending ? 'pending' : 'rejected',
      message: pending
        ? 'El pago todavía está en proceso.'
        : 'Bold informó que el pago no fue aprobado.',
    });
  }

  const expectedAmount = Math.round(Number(application.vip_plans?.monthly_price || 0));
  const paidAmount = Math.round(normalizeBoldAmount(boldResponse));
  if (paidAmount !== expectedAmount) {
    return res.status(409).json({ error: 'El valor confirmado por Bold no coincide con la membresía.' });
  }

  const transactionId = String(
    boldResponse?.transaction_id
    || boldResponse?.payload?.transaction_id
    || returnedOrderId
  );
  const rawPaymentMethod =
    boldResponse?.payment_method || boldResponse?.payload?.payment_method || 'CARD';
  const paymentMethod = paymentMethodForDatabase(rawPaymentMethod);

  const { data: existingMembership } = await supabase
    .from('vip_memberships')
    .select('id, status')
    .eq('user_id', application.user_id)
    .maybeSingle();

  let membershipId = existingMembership?.id || null;
  if (!existingMembership) {
    const { data: membership, error: membershipError } = await supabase
      .from('vip_memberships')
      .insert({
        user_id: application.user_id,
        plan_id: application.plan_id,
        status: 'requested',
        preferred_payment_method: paymentMethod,
        auto_renew: false,
      })
      .select('id')
      .single();

    if (membershipError) {
      return res.status(500).json({ error: 'El pago fue aprobado, pero no se pudo crear la membresía.' });
    }
    membershipId = membership.id;
  } else if (existingMembership.status !== 'active') {
    await supabase
      .from('vip_memberships')
      .update({
        plan_id: application.plan_id,
        status: 'requested',
        preferred_payment_method: paymentMethod,
      })
      .eq('id', existingMembership.id);
  }

  const { data: existingPayment } = await supabase
    .from('vip_payments')
    .select('id')
    .eq('external_reference', returnedOrderId)
    .maybeSingle();

  if (!existingPayment) {
    await supabase.from('vip_payments').insert({
      membership_id: membershipId,
      amount: expectedAmount,
      payment_method: paymentMethod,
      status: 'approved',
      external_reference: returnedOrderId,
      notes: `Transacción Bold ${transactionId}. Pendiente de revisión documental.`,
      paid_at: new Date().toISOString(),
    });
  }

  const { error: finalUpdateError } = await supabase
    .from('vip_applications')
    .update({
      payment_status: 'approved',
      payment_transaction_id: transactionId,
      status: 'under_review',
      paid_at: new Date().toISOString(),
    })
    .eq('id', application.id);

  if (finalUpdateError) {
    return res.status(500).json({ error: 'El pago fue aprobado, pero la solicitud requiere revisión manual.' });
  }

  return res.status(200).json({
    status: 'approved',
    membershipId,
    transactionId,
  });
}
