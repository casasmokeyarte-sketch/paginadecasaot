  -- ============================================================
  --  CASA OT — Fix Chat: Visibilidad de perfiles entre usuarios
  --  EJECUTAR en Supabase → SQL Editor
  -- ============================================================
  --
  --  PROBLEMA: La política actual "profiles_select_own" solo permite
  --  que cada usuario vea SU PROPIO perfil. Esto impide que el chat
  --  cargue nombres/avatares de otros usuarios y que se muestren
  --  usuarios conectados.
  --
  --  SOLUCIÓN: Reemplazar la política por una que permita a todos
  --  los usuarios autenticados leer perfiles básicos (necesario para chat).
  -- ============================================================

  -- 1. Eliminar política restrictiva y crear una abierta para lectura
  DROP POLICY IF EXISTS "profiles_select_own"      ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_all_auth" ON public.profiles;

  CREATE POLICY "profiles_select_all_auth"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

  -- Las políticas de INSERT y UPDATE permanecen igual (solo propio perfil o admin).

  -- ============================================================
  --  2. Habilitar Realtime para la tabla profiles
  --     (Necesario para presencia en tiempo real)
  -- ============================================================
  --  Esto NO se puede hacer por SQL — debes hacerlo en el dashboard:
  --  Supabase → Database → Replication → habilitar "public.profiles"
  --  O en: Supabase → Realtime → activar para la tabla profiles
  -- ============================================================

  -- 3. Verificar que Realtime está habilitado (consulta informativa)
  SELECT tablename, schemaname
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime';

  -- ============================================================
  --  DESPUÉS DE EJECUTAR:
  --    ✓ Los usuarios del chat podrán verse entre sí
  --    ✓ Los nombres aparecerán en las salas de chat
  --    ✓ La lista de "online" funcionará correctamente
  --  RECUERDA: Activar Realtime para profiles en el dashboard
  -- ============================================================
