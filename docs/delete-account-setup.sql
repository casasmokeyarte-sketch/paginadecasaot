-- ============================================================
-- FUNCIÓN: delete_user
-- Permite que un usuario autenticado elimine su propia cuenta
-- de auth.users desde el cliente (sin service role key).
--
-- INSTRUCCIONES:
-- 1. Abre Supabase → SQL Editor
-- 2. Pega y ejecuta este script
-- 3. Verifica que aparezca la función en Database → Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Elimina el perfil y datos relacionados en cascada (si tienes FK con ON DELETE CASCADE)
  DELETE FROM public.profiles WHERE user_id = auth.uid();

  -- Elimina el usuario de auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
