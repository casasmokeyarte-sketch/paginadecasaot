begin;

alter table if exists public.orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin_user()
);

drop policy if exists "orders_insert_self_or_admin" on public.orders;
create policy "orders_insert_self_or_admin"
on public.orders
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin_user()
);

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

commit;