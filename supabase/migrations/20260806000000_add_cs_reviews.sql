create table if not exists public.cs_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  score integer not null default 0 check (score between 0 and 100),
  matched_keywords text[] not null default '{}',
  answer text not null default '' check (char_length(answer) <= 2000),
  used_hint boolean not null default false,
  reviewed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.cs_reviews
  add column if not exists score integer not null default 0;

alter table public.cs_reviews
  add column if not exists matched_keywords text[] not null default '{}';

alter table public.cs_reviews
  add column if not exists answer text not null default '';

alter table public.cs_reviews
  add column if not exists used_hint boolean not null default false;

alter table public.cs_reviews
  add column if not exists reviewed_at timestamptz not null default now();

-- 복습 큐는 점수가 낮은 순, 오래된 순으로 조회한다.
create index if not exists cs_reviews_user_score_idx
  on public.cs_reviews (user_id, score, reviewed_at);

alter table public.cs_reviews enable row level security;

drop policy if exists "cs_reviews_select_own" on public.cs_reviews;
create policy "cs_reviews_select_own" on public.cs_reviews
for select using ((select auth.uid()) = user_id);

drop policy if exists "cs_reviews_insert_own" on public.cs_reviews;
create policy "cs_reviews_insert_own" on public.cs_reviews
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "cs_reviews_update_own" on public.cs_reviews;
create policy "cs_reviews_update_own" on public.cs_reviews
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "cs_reviews_delete_own" on public.cs_reviews;
create policy "cs_reviews_delete_own" on public.cs_reviews
for delete using ((select auth.uid()) = user_id);
