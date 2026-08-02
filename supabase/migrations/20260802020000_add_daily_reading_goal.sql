alter table public.users
  add column if not exists daily_read_goal integer not null default 3;

alter table public.users
  drop constraint if exists users_daily_read_goal_range;
alter table public.users
  add constraint users_daily_read_goal_range
  check (daily_read_goal between 1 and 20);

alter table public.daily_activities
  add column if not exists reading_goal integer not null default 3;

alter table public.daily_activities
  drop constraint if exists daily_activities_reading_goal_range;
alter table public.daily_activities
  add constraint daily_activities_reading_goal_range
  check (reading_goal between 1 and 20);
