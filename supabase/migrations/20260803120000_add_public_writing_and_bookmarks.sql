alter table public.writing_drafts
  alter column visibility set default 'public';

create table if not exists public.writing_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid not null references public.writing_drafts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, draft_id)
);

alter table public.writing_bookmarks enable row level security;

drop policy if exists "writing_bookmarks_select_own" on public.writing_bookmarks;
create policy "writing_bookmarks_select_own" on public.writing_bookmarks
for select using ((select auth.uid()) = user_id);

drop policy if exists "writing_bookmarks_insert_own" on public.writing_bookmarks;
create policy "writing_bookmarks_insert_own" on public.writing_bookmarks
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "writing_bookmarks_delete_own" on public.writing_bookmarks;
create policy "writing_bookmarks_delete_own" on public.writing_bookmarks
for delete using ((select auth.uid()) = user_id);

drop function if exists public.get_public_writing_drafts(uuid);

create function public.get_public_writing_drafts(p_id uuid default null)
returns table (
  id uuid,
  title text,
  content text,
  tags text[],
  visibility text,
  thumbnail_url text,
  sources jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  is_bookmarked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    draft.id,
    draft.title,
    draft.content,
    draft.tags,
    draft.visibility,
    draft.thumbnail_url,
    draft.sources,
    draft.created_at,
    draft.updated_at,
    author.nickname as author_name,
    exists (
      select 1
      from public.writing_bookmarks as bookmark
      where bookmark.draft_id = draft.id
        and bookmark.user_id = (select auth.uid())
    ) as is_bookmarked
  from public.writing_drafts as draft
  join public.users as author on author.id = draft.user_id
  where draft.visibility = 'public'
    and (p_id is null or draft.id = p_id)
  order by draft.updated_at desc;
$$;

revoke all on function public.get_public_writing_drafts(uuid) from public;
grant execute on function public.get_public_writing_drafts(uuid) to anon, authenticated;
