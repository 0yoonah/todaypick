alter table public.feed_reads
  add column if not exists first_read_at timestamptz,
  add column if not exists last_read_at timestamptz,
  add column if not exists read_count integer;

update public.feed_reads
set
  first_read_at = coalesce(first_read_at, read_at),
  last_read_at = coalesce(last_read_at, read_at),
  read_count = coalesce(read_count, 1)
where first_read_at is null
   or last_read_at is null
   or read_count is null;

alter table public.feed_reads
  alter column first_read_at set default now(),
  alter column first_read_at set not null,
  alter column last_read_at set default now(),
  alter column last_read_at set not null,
  alter column read_count set default 1,
  alter column read_count set not null;

alter table public.feed_reads
  drop constraint if exists feed_reads_read_count_positive;
alter table public.feed_reads
  add constraint feed_reads_read_count_positive check (read_count > 0);

create index if not exists feed_reads_user_last_read_at_idx
  on public.feed_reads (user_id, last_read_at desc);

drop policy if exists "feed_reads_delete_own" on public.feed_reads;
create policy "feed_reads_delete_own" on public.feed_reads
for delete using ((select auth.uid()) = user_id);

create or replace function public.record_feed_read(
  p_feed_id text,
  p_feed jsonb,
  p_read_date date
)
returns public.feed_reads
language plpgsql
security invoker
set search_path = ''
as $$
declare
  recorded_read public.feed_reads;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.feed_reads as existing (
    user_id,
    feed_id,
    feed,
    read_date,
    read_at,
    first_read_at,
    last_read_at,
    read_count
  )
  values (
    auth.uid(),
    p_feed_id,
    p_feed,
    p_read_date,
    now(),
    now(),
    now(),
    1
  )
  on conflict (user_id, feed_id, read_date)
  do update set
    feed = excluded.feed,
    read_at = excluded.read_at,
    last_read_at = excluded.last_read_at,
    read_count = existing.read_count + 1
  returning * into recorded_read;

  return recorded_read;
end;
$$;

revoke all on function public.record_feed_read(text, jsonb, date) from public;
grant execute on function public.record_feed_read(text, jsonb, date) to authenticated;
