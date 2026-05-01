-- ============================================================================
-- Fix recursive RLS policies for chat tables
-- Execute this in the Supabase SQL editor for the active project.
-- ============================================================================

alter table if exists public.chat_rooms enable row level security;
alter table if exists public.chat_participants enable row level security;
alter table if exists public.chat_messages enable row level security;

create or replace function public.is_chat_participant(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
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

create or replace function public.is_chat_room_creator(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
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

-- chat_rooms
drop policy if exists "chat_rooms_select_auth" on public.chat_rooms;
create policy "chat_rooms_select_auth"
on public.chat_rooms
for select
to authenticated
using (
  public.is_chat_participant(id)
);

drop policy if exists "chat_rooms_insert_auth" on public.chat_rooms;
create policy "chat_rooms_insert_auth"
on public.chat_rooms
for insert
to authenticated
with check (
  created_by = auth.uid()
);

-- chat_participants
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

-- chat_messages
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
