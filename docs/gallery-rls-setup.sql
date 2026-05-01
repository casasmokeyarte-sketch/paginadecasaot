-- ============================================================================
-- RLS setup for public.gallery_images
-- ============================================================================

alter table if exists public.gallery_images enable row level security;

drop policy if exists "gallery_select_all" on public.gallery_images;
create policy "gallery_select_all"
on public.gallery_images
for select
to anon, authenticated
using (true);

drop policy if exists "gallery_insert_all" on public.gallery_images;
create policy "gallery_insert_all"
on public.gallery_images
for insert
to anon, authenticated
with check (true);

drop policy if exists "gallery_delete_all" on public.gallery_images;
create policy "gallery_delete_all"
on public.gallery_images
for delete
to anon, authenticated
using (true);
