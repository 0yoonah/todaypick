-- 회원 직접 탈퇴와 가입 동의 기록 (v1.12.0)

-- 1. 가입 동의 기록
alter table public.users
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists terms_version text;

comment on column public.users.terms_agreed_at is
  '만 14세 이상 확인과 이용약관·개인정보처리방침 동의를 함께 받은 시각. 가입 트리거만 기록한다.';
comment on column public.users.terms_version is
  '동의한 약관 시행일(예: 2026-10-13). 가입 트리거만 기록한다.';

-- 2. 가입 트리거: 기존 동작(이메일, 닉네임)을 유지하고 동의 값을 더한다.
-- 시각은 클라이언트가 보낸 값이 아니라 DB의 now()를 쓴다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  agreed boolean := coalesce(new.raw_user_meta_data ->> 'terms_agreed', '') = 'true';
begin
  insert into public.users (id, email, nickname, terms_agreed_at, terms_version)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(coalesce(new.email, ''), '@', 1)),
    case when agreed then now() else null end,
    case when agreed then left(new.raw_user_meta_data ->> 'terms_version', 20) else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. 동의 값은 가입 트리거만 쓴다. users_update_own 정책이 본인 행의 모든 컬럼 수정을 허용하고,
-- 테이블 단위 UPDATE 권한이 있으면 컬럼 단위 revoke는 효과가 없으므로 변경 자체를 막는 트리거를 둔다.
create or replace function public.prevent_terms_consent_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.terms_agreed_at is distinct from old.terms_agreed_at
    or new.terms_version is distinct from old.terms_version then
    raise exception 'terms consent columns are read-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_terms_consent_update on public.users;
create trigger prevent_terms_consent_update
before update on public.users
for each row execute function public.prevent_terms_consent_update();

-- 4. 본인 계정 삭제. 사용자 기록 테이블과 users 행은 on delete cascade로 함께 지워진다.
-- Storage 파일은 SQL로 지울 수 없어 앱이 계정 삭제 전에 Storage API로 지운다.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- rpc를 직접 불러 비밀번호 재확인을 건너뛰지 못하게, 최근 5분 안에 비밀번호로 로그인한 세션만 허용한다.
  -- /api/account는 비밀번호를 다시 확인하며 새 세션을 받은 직후 이 함수를 부른다.
  if not exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as factor
    where factor ->> 'method' = 'password'
      and (factor ->> 'timestamp')::bigint >= extract(epoch from now())::bigint - 300
  ) then
    raise exception 'recent password sign-in required' using errcode = '42501';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
