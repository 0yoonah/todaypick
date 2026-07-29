alter table public.users
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();
