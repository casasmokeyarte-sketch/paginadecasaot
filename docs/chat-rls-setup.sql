-- ============================================================================
-- RLS setup for chat tables (current app flow)
-- ============================================================================

alter table if exists public.chat_rooms enable row level security;
alter table if exists public.chat_participants enable row level security;
alter table if exists public.chat_messages enable row level security;
alter table if exists public.user_blocks enable row level security;
alter table if exists public.user_reports enable row level security;

-- chat_rooms
drop policy if exists "chat_rooms_select_auth" on public.chat_rooms;
create policy "chat_rooms_select_auth"
on public.chat_rooms
for select
to authenticated
using (true);

drop policy if exists "chat_rooms_insert_auth" on public.chat_rooms;
create policy "chat_rooms_insert_auth"
on public.chat_rooms
for insert
to authenticated
with check (true);

-- chat_participants
drop policy if exists "chat_participants_select_auth" on public.chat_participants;
create policy "chat_participants_select_auth"
on public.chat_participants
for select
to authenticated
using (true);

drop policy if exists "chat_participants_insert_auth" on public.chat_participants;
create policy "chat_participants_insert_auth"
on public.chat_participants
for insert
to authenticated
with check (true);

-- chat_messages
drop policy if exists "chat_messages_select_auth" on public.chat_messages;
create policy "chat_messages_select_auth"
on public.chat_messages
for select
to authenticated
using (true);

drop policy if exists "chat_messages_insert_auth" on public.chat_messages;
create policy "chat_messages_insert_auth"
on public.chat_messages
for insert
to authenticated
with check (sender_id = auth.uid());

-- moderation helpers used by the chat UI
drop policy if exists "user_blocks_select_auth" on public.user_blocks;
create policy "user_blocks_select_auth"
on public.user_blocks
for select
to authenticated
using (true);

drop policy if exists "user_blocks_insert_auth" on public.user_blocks;
create policy "user_blocks_insert_auth"
on public.user_blocks
for insert
to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "user_reports_insert_auth" on public.user_reports;
create policy "user_reports_insert_auth"
on public.user_reports
for insert
to authenticated
with check (reporter_id = auth.uid());
