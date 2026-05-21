-- ============================================================
--  CASA OT — Billing System Setup
--  Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Agregar columnas de inventario a la tabla products
-- ------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock              INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS sku               TEXT;


-- 2. Función para generar número de factura: FACT-YYYY-NNNN
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year  TEXT;
  v_seq   INTEGER;
  v_num   TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0
  ) + 1
  INTO v_seq
  FROM invoices
  WHERE invoice_number LIKE 'FACT-' || v_year || '-%';

  v_num := 'FACT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_num;
END;
$$;


-- 3. Crear tabla invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT          NOT NULL UNIQUE,

  -- Referencia a orden existente (opcional)
  order_id        UUID          REFERENCES orders(id) ON DELETE SET NULL,

  -- Datos del cliente (snapshot al momento de emitir)
  user_id         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name     TEXT          NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  client_address  TEXT,
  client_nit      TEXT,          -- NIT o cédula para factura

  -- Ítems de la factura (JSON array)
  -- Estructura: [{ product_id, name, quantity, unit_price, subtotal }]
  items           JSONB         NOT NULL DEFAULT '[]',

  -- Valores monetarios (en pesos colombianos)
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,4)  NOT NULL DEFAULT 0.19,   -- IVA 19%
  tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- Estado
  status          TEXT          NOT NULL DEFAULT 'borrador'
                  CHECK (status IN ('borrador','emitida','pagada','anulada')),

  -- Método de pago
  payment_method  TEXT          DEFAULT 'efectivo'
                  CHECK (payment_method IN ('efectivo','transferencia','tarjeta','nequi')),

  notes           TEXT,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- 4. Trigger para actualizar updated_at automáticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 5. Row Level Security (RLS) — solo admins pueden gestionar facturas
-- ------------------------------------------------------------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Eliminar política si ya existe para evitar errores al re-ejecutar
DROP POLICY IF EXISTS "Admins pueden gestionar facturas" ON invoices;

CREATE POLICY "Admins pueden gestionar facturas"
  ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );


-- 6. Índices para rendimiento
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_status         ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at     ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id        ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id       ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_products_stock          ON products(stock);


-- ============================================================
--  7. Tabla store_visits — "Anúnciate" desde la web
-- ============================================================
CREATE TABLE IF NOT EXISTS store_visits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name  TEXT        NOT NULL,
  phone         TEXT,
  arrival_time  TIMESTAMPTZ NOT NULL,
  people_count  INTEGER     NOT NULL DEFAULT 1,
  visit_reason  TEXT,
  notes         TEXT,
  status        TEXT        NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente','atendido','cancelado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: cualquier visitante puede insertar, solo admins pueden leer/actualizar
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visitantes pueden anunciarse" ON store_visits;
CREATE POLICY "Visitantes pueden anunciarse"
  ON store_visits FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins gestionan visitas" ON store_visits;
CREATE POLICY "Admins gestionan visitas"
  ON store_visits FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins actualizan visitas" ON store_visits;
CREATE POLICY "Admins actualizan visitas"
  ON store_visits FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_store_visits_arrival ON store_visits(arrival_time);
CREATE INDEX IF NOT EXISTS idx_store_visits_status  ON store_visits(status);


-- ============================================================
--  FIN DEL SCRIPT
--  Después de ejecutar, verificar en Table Editor:
--    ✓ Tabla "invoices" creada con todas las columnas
--    ✓ Tabla "products" con columnas: stock, sku, low_stock_threshold
--    ✓ Tabla "store_visits" creada para la función "Anúnciate"
-- ============================================================
