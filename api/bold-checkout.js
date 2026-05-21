import crypto from 'crypto';

/**
 * POST /api/bold-checkout
 * Recibe los items del carrito, calcula el total en COP,
 * genera un orderId único y el hash SHA-256 de integridad.
 * La secret key NUNCA sale del servidor.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey    = process.env.BOLD_API_KEY;
  const secretKey = process.env.BOLD_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Pasarela Bold no configurada. Agrega BOLD_API_KEY y BOLD_SECRET_KEY.' });
  }

  const { cartItems } = req.body;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  // Calcular total en COP sin decimales (Bold requiere entero)
  const amount = cartItems.reduce((total, item) => {
    const priceCents = item.variant.sale_price_in_cents ?? item.variant.price_in_cents ?? 0;
    return total + Math.round(priceCents / 100) * item.quantity;
  }, 0);

  if (amount < 1000) {
    return res.status(400).json({ error: 'El monto mínimo de pago es $1.000 COP' });
  }

  // Identificador único por orden (timestamp para evitar duplicados)
  const orderId = `CSA-${Date.now()}`;

  // Hash SHA-256: orderId + amount + currency + secretKey (orden exacto requerido por Bold)
  const cadena = `${orderId}${amount}COP${secretKey}`;
  const hash   = crypto.createHash('sha256').update(cadena, 'utf8').digest('hex');

  return res.status(200).json({ orderId, amount, hash, apiKey });
}
