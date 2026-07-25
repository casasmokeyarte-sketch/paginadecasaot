begin;

-- Enable Row Level Security
alter table if exists public.pqr enable row level security;

-- 1. Insert Policy: Allow anyone (anon and authenticated) to submit a PQR
drop policy if exists "pqr_insert_public" on public.pqr;
create policy "pqr_insert_public"
on public.pqr
for insert
with check (true);

-- 2. Select Policy: Allow authenticated users to view their own PQRs, and admins to view all
drop policy if exists "pqr_select_own_or_admin" on public.pqr;
create policy "pqr_select_own_or_admin"
on public.pqr
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin_user()
);

-- 3. Update Policy: Allow only admins to update PQRs (such as replying or changing status)
drop policy if exists "pqr_update_admin" on public.pqr;
create policy "pqr_update_admin"
on public.pqr
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- Grant explicit privileges to make sure POST/GET queries execute correctly
grant select, insert, update on public.pqr to authenticated, anon;

commit;
