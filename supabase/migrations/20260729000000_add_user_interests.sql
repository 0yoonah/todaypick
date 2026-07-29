alter table public.users
add column if not exists interests text[] not null default '{}';

alter table public.users
drop constraint if exists users_interests_valid;

alter table public.users
add constraint users_interests_valid
check (
  interests <@ array[
    'frontend',
    'backend',
    'ai_data',
    'infra_devops',
    'security',
    'career'
  ]::text[]
);
