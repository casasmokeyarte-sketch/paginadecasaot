-- ============================================================
-- SISTEMA DE FACTURACIÓN - Casa Smoke y Arte SSOT S.A.S
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar campo stock a la tabla de productos (si no existe)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- 2. Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,           -- Ej: FACT-2026-0001
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Datos del cliente (snapshot al momento de facturar)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_nit TEXT,                               -- NIT o cédula del cliente

  -- Items facturados (JSON snapshot de los productos)
  items JSONB NOT NULL DEFAULT '[]',             -- [{name, quantity, unit_price, subtotal}]

  -- Totales
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19.00,  -- IVA Colombia 19%
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Control
  status TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'emitida', 'pagada', 'anulada')),
  notes TEXT,
  payment_method TEXT DEFAULT 'efectivo',        -- efectivo, transferencia, tarjeta

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  issued_at TIMESTAMPTZ
);

-- 3. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- 4. RLS (Row Level Security) - Solo admins pueden gestionar facturas
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoices_updated_at();

-- 6. Función para generar número de factura secuencial
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  inv_number TEXT;
BEGIN
  year_part := TO_CHAR(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE 'FACT-' || year_part || '-%';
  inv_number := 'FACT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN inv_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VERIFICACIÓN - ejecutar para confirmar
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('stock','sku','low_stock_threshold');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices';
