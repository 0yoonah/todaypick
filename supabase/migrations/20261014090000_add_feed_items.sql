-- RSS 글 저장소와 예약 수집 (v1.13.0)
-- 설계: docs/superpowers/specs/2026-10-14-feed-db-collection-design.md
-- 운영 절차: docs/feed-collection.md
-- 비밀값(feed_collector_secret)은 이 파일에 넣지 않는다. Vault에 따로 등록한다.

-- 1. 수집한 RSS 글
-- id는 정규화한 원문 URL로, scraped_feeds·feed_reads의 feed->>'id'와 같은 값이다.
create table if not exists public.feed_items (
  id text primary key,
  source_id text not null,
  category text not null check (category in ('it_news', 'tech_blog')),
  title text not null,
  description text not null default '',
  image_url text,
  author text,
  interests text[] not null default '{}',
  published_at timestamptz not null,
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.feed_items is
  'RSS 예약 수집으로 저장한 글. 카드 표시 범위만 저장하고 본문은 저장하지 않는다. 발행 후 1년이 지나면 지운다.';

create index if not exists feed_items_category_published_idx
  on public.feed_items (category, published_at desc, id);

-- 모든 사용자에게 같은 공개 콘텐츠라 읽기는 누구나, 쓰기는 upsert_feed_items로만 한다.
alter table public.feed_items enable row level security;

drop policy if exists feed_items_select_all on public.feed_items;
create policy feed_items_select_all on public.feed_items
  for select to anon, authenticated
  using (true);

revoke insert, update, delete on public.feed_items from anon, authenticated;

-- 2. 수집 API가 부르는 쓰기 함수
-- 서비스 롤 키 대신 Vault에 둔 비밀값을 확인한다. 비밀값이 이 함수의 권한 전부다.
create or replace function public.upsert_feed_items(p_secret text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  upserted_count integer := 0;
  deleted_count integer := 0;
begin
  select decrypted_secret into expected
  from vault.decrypted_secrets
  where name = 'feed_collector_secret'
  limit 1;

  if expected is null or p_secret is null or p_secret <> expected then
    raise exception 'invalid collector secret' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 2000 then
    raise exception 'invalid feed items' using errcode = '22023';
  end if;

  -- 같은 요청 안의 중복 id는 하나만 쓴다. on conflict가 한 행을 두 번 고치면 오류가 난다.
  insert into public.feed_items as f (
    id, source_id, category, title, description, image_url, author, interests, published_at
  )
  select distinct on (item ->> 'id')
    left(item ->> 'id', 2048),
    left(item ->> 'source_id', 50),
    item ->> 'category',
    left(item ->> 'title', 200),
    left(coalesce(item ->> 'description', ''), 300),
    nullif(left(coalesce(item ->> 'image_url', ''), 2048), ''),
    nullif(left(coalesce(item ->> 'author', ''), 100), ''),
    coalesce(
      array(
        select left(interest, 30)
        from jsonb_array_elements_text(
          case when jsonb_typeof(item -> 'interests') = 'array' then item -> 'interests' else '[]'::jsonb end
        ) as interest
      ),
      '{}'
    ),
    (item ->> 'published_at')::timestamptz
  from jsonb_array_elements(p_items) as item
  where jsonb_typeof(item) = 'object'
    and coalesce(item ->> 'id', '') ~ '^https?://'
    and length(item ->> 'id') <= 2048
    and item ->> 'category' in ('it_news', 'tech_blog')
    and coalesce(item ->> 'title', '') <> ''
    and coalesce(item ->> 'source_id', '') <> ''
    and coalesce(item ->> 'published_at', '') <> ''
  order by item ->> 'id'
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    image_url = excluded.image_url,
    author = excluded.author,
    interests = excluded.interests,
    updated_at = now();
  -- published_at, source_id, collected_at은 처음 값을 유지한다. 발행 시각이 바뀌어 글이 위로 튀지 않게 한다.

  get diagnostics upserted_count = row_count;

  delete from public.feed_items
  where published_at < now() - interval '1 year';

  get diagnostics deleted_count = row_count;

  return jsonb_build_object('upserted', upserted_count, 'deleted', deleted_count);
end;
$$;

revoke all on function public.upsert_feed_items(text, jsonb) from public;
grant execute on function public.upsert_feed_items(text, jsonb) to anon, authenticated;

-- 3. 3시간마다 수집 API 호출 (UTC 기준 매 3시간 5분)
-- 같은 이름으로 다시 등록하면 기존 작업을 덮어쓴다.
-- pg_cron은 20260802010000에서 이미 켰다. 새 환경에서도 이 파일만으로 동작하도록 다시 확인한다.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select cron.schedule(
  'collect-feeds',
  '5 */3 * * *',
  $job$
  select net.http_post(
    url := 'https://tdpick.vercel.app/api/feeds/collect',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'feed_collector_secret' limit 1),
        ''
      )
    ),
    timeout_milliseconds := 60000
  );
  $job$
);
