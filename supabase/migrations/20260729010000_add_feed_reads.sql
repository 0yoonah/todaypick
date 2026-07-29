create table if not exists public.feed_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feed_id text not null,
  feed jsonb not null,
  read_date date not null,
  read_at timestamptz not null default now(),
  unique (user_id, feed_id, read_date)
);

create index if not exists feed_reads_user_read_date_idx
  on public.feed_reads (user_id, read_date);

alter table public.feed_reads enable row level security;

drop policy if exists "feed_reads_select_own" on public.feed_reads;
create policy "feed_reads_select_own" on public.feed_reads
for select using ((select auth.uid()) = user_id);

drop policy if exists "feed_reads_insert_own" on public.feed_reads;
create policy "feed_reads_insert_own" on public.feed_reads
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "feed_reads_update_own" on public.feed_reads;
create policy "feed_reads_update_own" on public.feed_reads
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
