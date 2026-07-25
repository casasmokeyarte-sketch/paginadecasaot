-- SQL migration to allow direct client-side insert of orders
begin;

alter table if exists public.orders enable row level security;

-- Drop previous insert policy
drop policy if exists "orders_insert_self_or_admin" on public.orders;

-- Recreate it to allow public/anon inserts under the safe condition that:
-- 1. user_id is null (guest checkout) OR
-- 2. user_id matches the authenticated user ID (auth.uid()) OR
-- 3. the user has an admin role
create policy "orders_insert_self_or_admin"
on public.orders
for insert
to public
with check (
  user_id is null
  or user_id = auth.uid()
  or public.is_admin_user()
);

commit;
