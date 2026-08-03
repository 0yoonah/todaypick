create table if not exists public.writing_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  content text not null default '' check (char_length(content) <= 50000),
  tags text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(sources) = 'array')
);

create index if not exists writing_drafts_user_updated_at_idx
  on public.writing_drafts (user_id, updated_at desc);

drop trigger if exists set_writing_drafts_updated_at on public.writing_drafts;
create trigger set_writing_drafts_updated_at
before update on public.writing_drafts
for each row execute function public.set_updated_at();

alter table public.writing_drafts enable row level security;

drop policy if exists "writing_drafts_select_own" on public.writing_drafts;
create policy "writing_drafts_select_own" on public.writing_drafts
for select using ((select auth.uid()) = user_id);
drop policy if exists "writing_drafts_insert_own" on public.writing_drafts;
create policy "writing_drafts_insert_own" on public.writing_drafts
for insert with check ((select auth.uid()) = user_id);
drop policy if exists "writing_drafts_update_own" on public.writing_drafts;
create policy "writing_drafts_update_own" on public.writing_drafts
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "writing_drafts_delete_own" on public.writing_drafts;
create policy "writing_drafts_delete_own" on public.writing_drafts
for delete using ((select auth.uid()) = user_id);
