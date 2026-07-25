-- SQL migration to set up Row Level Security (RLS) for the wishlist table
begin;

-- Enable RLS on wishlist
alter table if exists public.wishlist enable row level security;

-- Drop any existing policies to avoid conflicts
drop policy if exists "wishlist_select_own" on public.wishlist;
drop policy if exists "wishlist_insert_own" on public.wishlist;
drop policy if exists "wishlist_delete_own" on public.wishlist;

-- Policy to allow users to view their own wishlist items
create policy "wishlist_select_own"
on public.wishlist
for select
to authenticated
using (user_id = auth.uid());

-- Policy to allow users to insert their own wishlist items
create policy "wishlist_insert_own"
on public.wishlist
for insert
to authenticated
with check (user_id = auth.uid());

-- Policy to allow users to delete their own wishlist items
create policy "wishlist_delete_own"
on public.wishlist
for delete
to authenticated
using (user_id = auth.uid());

commit;
