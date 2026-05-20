export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Pasarela de pago no configurada' });
  }

  const { items, successUrl, cancelUrl } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const preference = {
    items: items.map((item) => ({
      title: String(item.title).slice(0, 256),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: 'COP',
    })),
    back_urls: {
      success: successUrl,
      failure: cancelUrl,
      pending: cancelUrl,
    },
    auto_return: 'approved',
    statement_descriptor: 'Casa Smoke y Arte',
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: data.message || 'Error al crear el pago' });
    }

    return res.status(200).json({ url: data.init_point });
  } catch {
    return res.status(500).json({ error: 'Error de conexión con MercadoPago' });
  }
}
