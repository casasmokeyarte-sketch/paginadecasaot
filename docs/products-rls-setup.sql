-- ============================================================================
-- RLS setup for public.products (current admin flow uses anon key + localStorage)
-- ============================================================================

alter table if exists public.products enable row level security;

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_insert_all" on public.products;
create policy "products_insert_all"
on public.products
for insert
to anon, authenticated
with check (true);

drop policy if exists "products_update_all" on public.products;
create policy "products_update_all"
on public.products
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "products_delete_all" on public.products;
create policy "products_delete_all"
on public.products
for delete
to anon, authenticated
using (true);
