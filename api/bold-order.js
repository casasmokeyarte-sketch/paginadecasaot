import { createClient } from '@supabase/supabase-js';

const getEnv = (name, fallback = '') => process.env[name] || fallback;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://igvmfhpnjcdbamtijjzo.supabase.co');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey) {
    return res.status(500).json({
      error: 'Falta SUPABASE_SERVICE_ROLE_KEY en Vercel para registrar pedidos de forma segura.',
    });
  }

  const { userId = null, items = [], totalAmount = 0, paymentStatus = 'paid' } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No se recibieron items para crear el pedido.' });
  }

  const parsedTotalAmount = Number(totalAmount) || 0;

  if (parsedTotalAmount <= 0) {
    return res.status(400).json({ error: 'El total del pedido no es válido.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const payload = {
    user_id: userId,
    items,
    total_amount: parsedTotalAmount,
    status: paymentStatus === 'approved' ? 'paid' : paymentStatus,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message || 'No se pudo registrar el pedido.' });
  }

  return res.status(200).json({ id: data?.id || null });
}