begin;

-- 1. Extend public.profiles table with new fields, visibility flags, and credit/data authorization flag
alter table public.profiles
add column if not exists username text,
add column if not exists city text,
add column if not exists country text,
add column if not exists gender text,
add column if not exists interests text,
add column if not exists is_city_public boolean default true,
add column if not exists is_country_public boolean default true,
add column if not exists is_gender_public boolean default true,
add column if not exists is_interests_public boolean default true,
add column if not exists is_profile_public boolean default true,
add column if not exists is_data_authorized boolean default false;

-- 2. Create profile_reactions table
create table if not exists public.profile_reactions (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text check (reaction_type in ('like', 'heart', 'devil')) not null,
  created_at timestamptz default now() not null,
  constraint unique_user_reaction unique (from_user_id, to_user_id)
);

-- Enable Row Level Security on profile_reactions
alter table public.profile_reactions enable row level security;

-- Policies for profile_reactions
drop policy if exists "profile_reactions_select_all" on public.profile_reactions;
create policy "profile_reactions_select_all"
on public.profile_reactions
for select
to authenticated
using (true);

drop policy if exists "profile_reactions_insert_own" on public.profile_reactions;
create policy "profile_reactions_insert_own"
on public.profile_reactions
for insert
to authenticated
with check (from_user_id = auth.uid());

drop policy if exists "profile_reactions_update_own" on public.profile_reactions;
create policy "profile_reactions_update_own"
on public.profile_reactions
for update
to authenticated
using (from_user_id = auth.uid())
with check (from_user_id = auth.uid());

drop policy if exists "profile_reactions_delete_own" on public.profile_reactions;
create policy "profile_reactions_delete_own"
on public.profile_reactions
for delete
to authenticated
using (from_user_id = auth.uid());

-- 3. Create profile_notifications table (drop first to recreate with explicit constraint names)
drop table if exists public.profile_notifications cascade;

create table public.profile_notifications (
  id uuid default gen_random_uuid() primary key,
  to_user_id uuid not null,
  from_user_id uuid not null,
  message text not null,
  read boolean default false not null,
  created_at timestamptz default now() not null,
  constraint profile_notifications_from_user_id_fkey foreign key (from_user_id) references public.profiles(id) on delete cascade,
  constraint profile_notifications_to_user_id_fkey foreign key (to_user_id) references public.profiles(id) on delete cascade
);

-- Enable Row Level Security on profile_notifications
alter table public.profile_notifications enable row level security;

-- Policies for profile_notifications
drop policy if exists "profile_notifications_select_own" on public.profile_notifications;
create policy "profile_notifications_select_own"
on public.profile_notifications
for select
to authenticated
using (to_user_id = auth.uid());

drop policy if exists "profile_notifications_insert_all" on public.profile_notifications;
create policy "profile_notifications_insert_all"
on public.profile_notifications
for insert
to authenticated
with check (from_user_id = auth.uid());

drop policy if exists "profile_notifications_update_own" on public.profile_notifications;
create policy "profile_notifications_update_own"
on public.profile_notifications
for update
to authenticated
using (to_user_id = auth.uid())
with check (to_user_id = auth.uid());

drop policy if exists "profile_notifications_delete_own" on public.profile_notifications;
create policy "profile_notifications_delete_own"
on public.profile_notifications
for delete
to authenticated
using (to_user_id = auth.uid());

-- Grant privileges
grant select, insert, update, delete on public.profile_reactions to authenticated;
grant select, insert, update, delete on public.profile_notifications to authenticated;

-- Enable real-time for chat tables (if publication exists)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages;
    alter publication supabase_realtime add table public.chat_rooms;
    alter publication supabase_realtime add table public.chat_participants;
  end if;
exception when others then
  -- Ignore if tables are already in publication
end $$;

commit;
