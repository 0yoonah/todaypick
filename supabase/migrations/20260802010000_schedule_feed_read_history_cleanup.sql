create extension if not exists pg_cron;

create index if not exists feed_reads_last_read_at_idx
  on public.feed_reads (last_read_at);

create or replace function public.cleanup_feed_read_history()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.feed_reads
  where (last_read_at at time zone 'Asia/Seoul')::date
    < (now() at time zone 'Asia/Seoul')::date - 29;

  with ranked_reads as (
    select
      id,
      row_number() over (
        partition by user_id
        order by last_read_at desc, id desc
      ) as position
    from public.feed_reads
  )
  delete from public.feed_reads as feed_read
  using ranked_reads
  where feed_read.id = ranked_reads.id
    and ranked_reads.position > 100;
end;
$$;

revoke all on function public.cleanup_feed_read_history() from public;
revoke all on function public.cleanup_feed_read_history() from anon;
revoke all on function public.cleanup_feed_read_history() from authenticated;

select public.cleanup_feed_read_history();

select cron.schedule(
  'cleanup-feed-read-history',
  '15 18 * * *',
  $$select public.cleanup_feed_read_history();$$
);
