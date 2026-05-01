-- ============================================================================
-- Storage buckets for admin uploads
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('podcast-media', 'podcast-media', true),
  ('education-media', 'education-media', true),
  ('gallery-images', 'gallery-images', true),
  ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Public read for files
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Public read podcast media" on storage.objects;
create policy "Public read podcast media"
on storage.objects for select
to public
using (bucket_id = 'podcast-media');

drop policy if exists "Public read education media" on storage.objects;
create policy "Public read education media"
on storage.objects for select
to public
using (bucket_id = 'education-media');

drop policy if exists "Public read gallery images" on storage.objects;
create policy "Public read gallery images"
on storage.objects for select
to public
using (bucket_id = 'gallery-images');

drop policy if exists "Public read chat attachments" on storage.objects;
create policy "Public read chat attachments"
on storage.objects for select
to public
using (bucket_id = 'chat-attachments');

-- Upload/delete policy for current admin flow.
-- NOTE: current admin panel uses localStorage, not Supabase auth role checks.
-- Tighten these policies after migrating admin to Supabase-authenticated roles.
drop policy if exists "Upload product images" on storage.objects;
create policy "Upload product images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'product-images');

drop policy if exists "Upload podcast media" on storage.objects;
create policy "Upload podcast media"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'podcast-media');

drop policy if exists "Upload education media" on storage.objects;
create policy "Upload education media"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'education-media');

drop policy if exists "Upload gallery images" on storage.objects;
create policy "Upload gallery images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'gallery-images');

drop policy if exists "Upload chat attachments" on storage.objects;
create policy "Upload chat attachments"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'chat-attachments');

drop policy if exists "Delete product images" on storage.objects;
create policy "Delete product images"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Delete podcast media" on storage.objects;
create policy "Delete podcast media"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'podcast-media');

drop policy if exists "Delete education media" on storage.objects;
create policy "Delete education media"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'education-media');

drop policy if exists "Delete gallery images" on storage.objects;
create policy "Delete gallery images"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'gallery-images');

drop policy if exists "Delete chat attachments" on storage.objects;
create policy "Delete chat attachments"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'chat-attachments');
