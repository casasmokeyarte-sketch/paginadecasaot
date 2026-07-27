-- ============================================================================
-- CASA SMOKE Y ARTE — CHAT-OT COMPLETE DATABASE RECOVERY FIX
-- EJECUTAR en Supabase → SQL Editor para corregir carga de chats y mensajes
-- ============================================================================

begin;

-- ============================================================================
-- 1. CORREGIR VISIBILIDAD DE PERFILES (Evita que cargue la lista vacía de miembros)
-- ============================================================================
-- Eliminar políticas antiguas restrictivas de perfiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_all_auth" on public.profiles;

-- Crear política que permita a cualquier usuario autenticado de la oficina
-- leer los perfiles para poder iniciar chats, ver avatares y nombres.
create policy "profiles_select_all_auth"
on public.profiles
for select
to authenticated
using (true);


-- ============================================================================
-- 2. CORREGIR FUNCIONES DE SEGURIDAD (Con row_security = off para evitar recursión)
-- ============================================================================

-- Función para verificar si un usuario es participante de un chat (evitando recursión RLS)
create or replace function public.is_chat_participant(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1
    from public.chat_participants cp
    where cp.room_id = target_room_id
      and cp.user_id = auth.uid()
  );
$$;

revoke all on function public.is_chat_participant(uuid) from public;
grant execute on function public.is_chat_participant(uuid) to authenticated;

-- Función para verificar si un usuario es creador de la sala de chat (evitando recursión RLS)
create or replace function public.is_chat_room_creator(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select exists (
    select 1
    from public.chat_rooms cr
    where cr.id = target_room_id
      and cr.created_by = auth.uid()
  );
$$;

revoke all on function public.is_chat_room_creator(uuid) from public;
grant execute on function public.is_chat_room_creator(uuid) to authenticated;


-- ============================================================================
-- 3. HABILITAR RLS Y REESTABLECER POLÍTICAS DE CHAT (RECURSION-FREE)
-- ============================================================================
alter table if exists public.chat_rooms enable row level security;
alter table if exists public.chat_participants enable row level security;
alter table if exists public.chat_messages enable row level security;

-- --- chat_rooms ---
drop policy if exists "chat_rooms_select_auth" on public.chat_rooms;
create policy "chat_rooms_select_auth"
on public.chat_rooms
for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_chat_participant(id)
);

drop policy if exists "chat_rooms_insert_auth" on public.chat_rooms;
create policy "chat_rooms_insert_auth"
on public.chat_rooms
for insert
to authenticated
with check (
  created_by = auth.uid()
);

-- --- chat_participants ---
drop policy if exists "chat_participants_select_auth" on public.chat_participants;
create policy "chat_participants_select_auth"
on public.chat_participants
for select
to authenticated
using (
  public.is_chat_participant(room_id)
);

drop policy if exists "chat_participants_insert_auth" on public.chat_participants;
create policy "chat_participants_insert_auth"
on public.chat_participants
for insert
to authenticated
with check (
  public.is_chat_room_creator(room_id)
  or public.is_chat_participant(room_id)
  or user_id = auth.uid()
);

-- --- chat_messages ---
drop policy if exists "chat_messages_select_auth" on public.chat_messages;
create policy "chat_messages_select_auth"
on public.chat_messages
for select
to authenticated
using (
  public.is_chat_participant(room_id)
);

drop policy if exists "chat_messages_insert_auth" on public.chat_messages;
create policy "chat_messages_insert_auth"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_chat_participant(room_id)
);


-- ============================================================================
-- 4. POLÍTICAS DE BLOQUEOS Y REPORTES (MODERACIÓN)
-- ============================================================================
alter table if exists public.user_blocks enable row level security;
alter table if exists public.user_reports enable row level security;

drop policy if exists "user_blocks_select_auth" on public.user_blocks;
create policy "user_blocks_select_auth"
on public.user_blocks
for select
to authenticated
using (
  blocker_id = auth.uid() 
  or blocked_id = auth.uid()
);

drop policy if exists "user_blocks_insert_auth" on public.user_blocks;
create policy "user_blocks_insert_auth"
on public.user_blocks
for insert
to authenticated
with check (
  blocker_id = auth.uid()
);

drop policy if exists "user_blocks_delete_auth" on public.user_blocks;
create policy "user_blocks_delete_auth"
on public.user_blocks
for delete
to authenticated
using (
  blocker_id = auth.uid()
);

drop policy if exists "user_reports_insert_auth" on public.user_reports;
create policy "user_reports_insert_auth"
on public.user_reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
);

-- ============================================================================
-- 5. POLÍTICAS DE FACTURAS (INVOICES) — Permite a usuarios ver sus facturas
-- ============================================================================
alter table if exists public.invoices enable row level security;

drop policy if exists "Usuarios pueden ver sus propias facturas" on public.invoices;
create policy "Usuarios pueden ver sus propias facturas"
on public.invoices
for select
to authenticated
using (
  user_id = auth.uid()
);

commit;
