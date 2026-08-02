alter table public.daily_activities
  add column if not exists reading_goal_completed boolean not null default false;

update public.daily_activities as activity
set reading_goal_completed = coalesce(reads.read_count, 0) >= activity.reading_goal
from (
  select user_id, read_date, count(*)::integer as read_count
  from public.feed_reads
  group by user_id, read_date
) as reads
where activity.user_id = reads.user_id
  and activity.date = reads.read_date;

create index if not exists daily_activities_user_completed_date_idx
  on public.daily_activities (user_id, date desc)
  where reading_goal_completed = true;

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
  current_goal integer;
  daily_read_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.feed_reads as existing (
    user_id, feed_id, feed, read_date, read_at,
    first_read_at, last_read_at, read_count
  )
  values (
    auth.uid(), p_feed_id, p_feed, p_read_date, now(), now(), now(), 1
  )
  on conflict (user_id, feed_id, read_date)
  do update set
    feed = excluded.feed,
    read_at = excluded.read_at,
    last_read_at = excluded.last_read_at,
    read_count = existing.read_count + 1
  returning * into recorded_read;

  select reading_goal into current_goal
  from public.daily_activities
  where user_id = auth.uid() and date = p_read_date;

  select count(*)::integer into daily_read_count
  from public.feed_reads
  where user_id = auth.uid() and read_date = p_read_date;

  update public.daily_activities
  set reading_goal_completed = daily_read_count >= coalesce(current_goal, 3)
  where user_id = auth.uid() and date = p_read_date;

  return recorded_read;
end;
$$;

revoke all on function public.record_feed_read(text, jsonb, date) from public;
grant execute on function public.record_feed_read(text, jsonb, date) to authenticated;
