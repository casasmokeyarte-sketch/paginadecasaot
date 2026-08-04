-- ==========================================================================
-- CHAT-OT — PRESENCIA COMPARTIDA, HEARTBEAT Y REALTIME
-- Ejecutar en Supabase -> SQL Editor
-- ==========================================================================

create table if not exists public.chat_user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuario',
  avatar_url text,
  status text not null default 'online'
    check (status in ('online', 'idle', 'offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_user_presence_last_seen_idx
  on public.chat_user_presence(last_seen_at desc);

alter table public.chat_user_presence enable row level security;
alter table public.chat_user_presence replica identity full;

drop policy if exists "chat_presence_authenticated_read" on public.chat_user_presence;
create policy "chat_presence_authenticated_read"
  on public.chat_user_presence for select
  to authenticated
  using (true);

-- Las escrituras directas se bloquean; cada usuario actualiza solo su fila por RPC.
revoke insert, update, delete on public.chat_user_presence from anon, authenticated;
grant select on public.chat_user_presence to authenticated;

create or replace function public.chat_set_presence(
  p_status text,
  p_display_name text default null,
  p_avatar_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if p_status not in ('online', 'idle', 'offline') then
    raise exception 'Estado de presencia no valido.';
  end if;

  insert into public.chat_user_presence (
    user_id,
    display_name,
    avatar_url,
    status,
    last_seen_at,
    updated_at
  )
  values (
    v_user_id,
    left(coalesce(nullif(trim(p_display_name), ''), 'Usuario'), 120),
    left(nullif(trim(p_avatar_url), ''), 1000),
    p_status,
    now(),
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    status = excluded.status,
    last_seen_at = excluded.last_seen_at,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.chat_set_presence(text, text, text) from public, anon;
grant execute on function public.chat_set_presence(text, text, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_user_presence'
  ) then
    alter publication supabase_realtime add table public.chat_user_presence;
  end if;
end;
$$;

comment on table public.chat_user_presence is
  'Estado temporal del chat. Un registro online o ausente vence en el cliente si no recibe heartbeat.';

-- Verificacion:
-- select user_id, display_name, status, last_seen_at
-- from public.chat_user_presence order by last_seen_at desc;
