-- ============================================================================
-- user_events setup (Supabase/Postgres)
-- Purpose: collect product analytics events for web + admin live dashboard
-- Suggested retention: 90 days (see optional section at the bottom)
-- ============================================================================

create table if not exists public.user_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  page text not null default '/',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_events_created_at on public.user_events (created_at desc);
create index if not exists idx_user_events_action on public.user_events (action);
create index if not exists idx_user_events_user_id on public.user_events (user_id);

comment on table public.user_events is
  'Analytics events emitted by frontend (page_view, clicks, conversions, errors).';
comment on column public.user_events.user_id is
  'Authenticated user id when available. Null for anonymous traffic.';
comment on column public.user_events.metadata is
  'Arbitrary event payload as JSONB (small, non-sensitive fields only).';
comment on column public.user_events.created_at is
  'Server timestamp when the event row is created.';

alter table public.user_events enable row level security;

-- ----------------------------------------------------------------------------
-- 2) RLS policies
-- ----------------------------------------------------------------------------
-- Insert policy for authenticated users: user_id must match auth.uid().
drop policy if exists "user_events_insert_authenticated_self" on public.user_events;
create policy "user_events_insert_authenticated_self"
  on public.user_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Insert policy for anonymous users: only null user_id is allowed.
drop policy if exists "user_events_insert_anon_null_user" on public.user_events;
create policy "user_events_insert_anon_null_user"
  on public.user_events
  for insert
  to anon
  with check (user_id is null);

-- Keep SELECT open for now because the current admin panel uses anon key + realtime.
-- If you later migrate admin to authenticated-only access, tighten this policy.
drop policy if exists "user_events_select_all" on public.user_events;
create policy "user_events_select_all"
  on public.user_events
  for select
  to anon, authenticated
  using (true);

-- Deny update/delete from client roles (events should be append-only).
drop policy if exists "user_events_no_update" on public.user_events;
create policy "user_events_no_update"
  on public.user_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "user_events_no_delete" on public.user_events;
create policy "user_events_no_delete"
  on public.user_events
  for delete
  to anon, authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- 3) Realtime publication
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_events'
  ) then
    alter publication supabase_realtime add table public.user_events;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4) Optional retention cleanup (90 days)
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_user_events()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.user_events
  where created_at < now() - interval '90 days';
$$;

-- Optional scheduler (requires pg_cron extension enabled in your project):
-- select cron.schedule(
--   'cleanup-user-events-daily',
--   '15 3 * * *',
--   $$select public.cleanup_user_events();$$
-- );
