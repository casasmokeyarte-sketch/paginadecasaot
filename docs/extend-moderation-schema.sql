begin;

-- 1. Drop old tables if they exist to avoid constraint naming conflicts
drop table if exists public.user_blocks cascade;
drop table if exists public.user_reports cascade;

-- 2. Create user_blocks table with explicit constraints
create table public.user_blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz default now() not null,
  constraint user_blocks_blocker_id_fkey foreign key (blocker_id) references public.profiles(id) on delete cascade,
  constraint user_blocks_blocked_id_fkey foreign key (blocked_id) references public.profiles(id) on delete cascade,
  constraint unique_blocker_blocked unique (blocker_id, blocked_id)
);

-- Enable RLS on user_blocks
alter table public.user_blocks enable row level security;

-- Policies for user_blocks
create policy "user_blocks_select_auth"
on public.user_blocks
for select
to authenticated
using (true);

create policy "user_blocks_insert_auth"
on public.user_blocks
for insert
to authenticated
with check (blocker_id = auth.uid());

create policy "user_blocks_delete_auth"
on public.user_blocks
for delete
to authenticated
using (blocker_id = auth.uid());

-- 3. Create user_reports table with explicit constraints
create table public.user_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'investigating', 'resolved', 'dismissed')) not null,
  created_at timestamptz default now() not null,
  constraint user_reports_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete cascade,
  constraint user_reports_reported_id_fkey foreign key (reported_id) references public.profiles(id) on delete cascade,
  constraint unique_reporter_reported unique (reporter_id, reported_id)
);

-- Enable RLS on user_reports
alter table public.user_reports enable row level security;

-- Policies for user_reports
create policy "user_reports_select_auth"
on public.user_reports
for select
to authenticated
using (true);

create policy "user_reports_insert_auth"
on public.user_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "user_reports_update_admin"
on public.user_reports
for update
to authenticated
using (true)
with check (true);

create policy "user_reports_delete_admin"
on public.user_reports
for delete
to authenticated
using (true);

-- Grant privileges
grant select, insert, update, delete on public.user_blocks to authenticated;
grant select, insert, update, delete on public.user_reports to authenticated;

commit;
