begin;

-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 1. Select Policy: Allow public read access to all avatars
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- 2. Insert Policy: Allow authenticated users to upload only to their own folder (folder name matches user UUID)
drop policy if exists "Upload own avatars" on storage.objects;
create policy "Upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Delete Policy: Allow authenticated users to delete files only in their own folder
drop policy if exists "Delete own avatars" on storage.objects;
create policy "Delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
