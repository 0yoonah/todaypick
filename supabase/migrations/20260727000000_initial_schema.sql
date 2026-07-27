create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scraped_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feed jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists scraped_feeds_user_feed_id_key
  on public.scraped_feeds (user_id, (feed ->> 'id'));

create table if not exists public.scraped_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists scraped_quotes_user_quote_id_key
  on public.scraped_quotes (user_id, (quote ->> 'id'));

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text not null,
  selected_answer integer not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (user_id, quiz_id)
);

create table if not exists public.daily_activities (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  feed_clicked boolean not null default false,
  quiz_completed boolean not null default false,
  quote_viewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_activities_updated_at on public.daily_activities;
create trigger set_daily_activities_updated_at
before update on public.daily_activities
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, nickname)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.scraped_feeds enable row level security;
alter table public.scraped_quotes enable row level security;
alter table public.quiz_results enable row level security;
alter table public.daily_activities enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
for select using ((select auth.uid()) = id);
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
for insert with check ((select auth.uid()) = id);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "scraped_feeds_select_own" on public.scraped_feeds;
create policy "scraped_feeds_select_own" on public.scraped_feeds
for select using ((select auth.uid()) = user_id);
drop policy if exists "scraped_feeds_insert_own" on public.scraped_feeds;
create policy "scraped_feeds_insert_own" on public.scraped_feeds
for insert with check ((select auth.uid()) = user_id);
drop policy if exists "scraped_feeds_delete_own" on public.scraped_feeds;
create policy "scraped_feeds_delete_own" on public.scraped_feeds
for delete using ((select auth.uid()) = user_id);

drop policy if exists "scraped_quotes_select_own" on public.scraped_quotes;
create policy "scraped_quotes_select_own" on public.scraped_quotes
for select using ((select auth.uid()) = user_id);
drop policy if exists "scraped_quotes_insert_own" on public.scraped_quotes;
create policy "scraped_quotes_insert_own" on public.scraped_quotes
for insert with check ((select auth.uid()) = user_id);
drop policy if exists "scraped_quotes_delete_own" on public.scraped_quotes;
create policy "scraped_quotes_delete_own" on public.scraped_quotes
for delete using ((select auth.uid()) = user_id);

drop policy if exists "quiz_results_select_own" on public.quiz_results;
create policy "quiz_results_select_own" on public.quiz_results
for select using ((select auth.uid()) = user_id);
drop policy if exists "quiz_results_insert_own" on public.quiz_results;
create policy "quiz_results_insert_own" on public.quiz_results
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "daily_activities_select_own" on public.daily_activities;
create policy "daily_activities_select_own" on public.daily_activities
for select using ((select auth.uid()) = user_id);
drop policy if exists "daily_activities_insert_own" on public.daily_activities;
create policy "daily_activities_insert_own" on public.daily_activities
for insert with check ((select auth.uid()) = user_id);
drop policy if exists "daily_activities_update_own" on public.daily_activities;
create policy "daily_activities_update_own" on public.daily_activities
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and name like ((select auth.uid())::text || '%')
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
for update using (
  bucket_id = 'avatars'
  and name like ((select auth.uid())::text || '%')
) with check (
  bucket_id = 'avatars'
  and name like ((select auth.uid())::text || '%')
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
for delete using (
  bucket_id = 'avatars'
  and name like ((select auth.uid())::text || '%')
);
