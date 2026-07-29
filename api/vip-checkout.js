import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const getBearerToken = (req) => {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.BOLD_API_KEY;
  const secretKey = process.env.BOLD_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://igvmfhpnjcdbamtijjzo.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !secretKey || !serviceRoleKey) {
    return res.status(500).json({
      error: 'Falta configurar Bold o SUPABASE_SERVICE_ROLE_KEY en Vercel.',
    });
  }

  const accessToken = getBearerToken(req);
  const applicationId = String(req.body?.applicationId || '');
  if (!accessToken || !applicationId) {
    return res.status(401).json({ error: 'Sesión o solicitud no válida.' });
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
    .select('id, user_id, status, payment_order_id, document_front_path, document_back_path, vip_plans(monthly_price)')
    .eq('id', applicationId)
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (applicationError || !application) {
    return res.status(404).json({ error: 'No encontramos la solicitud VIP.' });
  }

  if (!application.document_front_path || !application.document_back_path) {
    return res.status(400).json({ error: 'Debes adjuntar ambos lados del documento antes de pagar.' });
  }

  if (!['draft', 'payment_pending'].includes(application.status)) {
    return res.status(409).json({ error: 'Esta solicitud ya fue procesada.' });
  }

  const amount = Math.round(Number(application.vip_plans?.monthly_price || 0));
  if (amount < 1000) {
    return res.status(400).json({ error: 'El valor del plan VIP no es válido.' });
  }

  const orderId = application.payment_order_id || `VIP-${application.id.slice(0, 8)}-${Date.now()}`;
  const integrity = crypto
    .createHash('sha256')
    .update(`${orderId}${amount}COP${secretKey}`, 'utf8')
    .digest('hex');

  const { error: updateError } = await supabase
    .from('vip_applications')
    .update({
      payment_order_id: orderId,
      payment_status: 'pending',
      status: 'payment_pending',
    })
    .eq('id', application.id)
    .eq('user_id', authData.user.id);

  if (updateError) {
    return res.status(500).json({ error: 'No se pudo preparar el pago VIP.' });
  }

  return res.status(200).json({
    orderId,
    amount,
    hash: integrity,
    apiKey,
    applicationId: application.id,
  });
}
