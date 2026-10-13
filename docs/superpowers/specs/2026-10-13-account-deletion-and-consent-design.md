# 회원 직접 탈퇴와 가입 동의 절차 설계

- 작성일: 2026-10-13
- 대상 버전: v1.12.0
- 상태: 승인됨 (DB 설계는 사용자 확인, 나머지는 사용자가 위임)

## 배경과 목표

v1.11.0에서 개인정보처리방침과 이용약관을 공개했지만 두 문서 모두 "서비스 안에 회원 탈퇴 기능이 없어 메일로 요청"하도록 안내한다. 회원가입 화면에는 약관 동의나 연령 확인 절차가 없고, 이용약관은 "이용하면 동의한 것으로 본다"고만 적었다.

이번 작업의 목표는 정책 문구와 실제 기능을 맞추는 것이다.

1. 회원이 프로필에서 비밀번호를 다시 입력해 **직접 탈퇴**하고, 계정과 모든 기록, 프로필 이미지가 즉시 지워진다.
2. 회원가입 때 **만 14세 이상 확인과 이용약관·개인정보처리방침 동의**를 필수로 받고, 동의 시각과 약관 버전을 기록한다.

### 성공 기준

- 탈퇴 후 같은 이메일로 로그인할 수 없고, 해당 사용자의 `public` 테이블 행과 `avatars` 파일이 남지 않는다.
- 비밀번호가 틀리면 아무것도 지워지지 않는다.
- 동의 체크 없이 가입 요청을 보내면 서버가 거부한다.
- 우리 화면으로 가입한 회원은 `users.terms_agreed_at`과 `terms_version`이 채워진다.
- 개인정보처리방침과 이용약관이 실제 동작과 일치한다.

### 범위 밖

- 내 기록 내보내기, 탈퇴 유예 기간
- 기존 회원의 재동의 화면 (기존 회원 동의 값은 null로 둔다)
- 서비스 롤 키 도입

## 설계 결정

| 결정 | 선택 | 이유 |
| --- | --- | --- |
| 계정 삭제 방식 | 본인 계정만 지우는 `security definer` DB 함수 | 비밀 키 없이 권한 범위를 "현재 로그인한 본인"으로 좁힌다. 서비스 롤 키는 RLS 전체를 우회하므로 두지 않는다. |
| 탈퇴 본인 확인 | 비밀번호 재입력 | 로그인된 기기를 다른 사람이 쓰는 경우까지 막는다. |
| 동의 기록 | `users`에 동의 시각·약관 버전 저장 | 동의 여부를 나중에 확인할 수 있다. 탈퇴용 migration에 함께 넣어 운영 적용을 한 번에 한다. |
| 탈퇴 확인 UI | 프로필 하단의 펼침형 인라인 폼 | 다이얼로그 컴포넌트가 없어 포커스 트랩을 새로 만들지 않는다. |

## 1. DB (migration 1개)

파일: `supabase/migrations/20261013090000_add_account_deletion_and_consent.sql`

### 1-1. 동의 컬럼

```sql
alter table public.users
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists terms_version text;
```

- `terms_agreed_at`: 만 14세 이상 확인과 이용약관·개인정보처리방침 동의를 **함께** 받은 시각. 두 항목은 모두 필수라 한 시각으로 기록한다.
- `terms_version`: 동의한 약관 시행일 (예: `2026-10-13`).
- 기존 회원은 null.

### 1-2. 가입 트리거 보강

`handle_new_user()`를 `create or replace`로 갱신한다. 기존 동작(이메일, 닉네임 기록)은 유지하고 다음을 더한다.

- `raw_user_meta_data ->> 'terms_agreed' = 'true'`일 때만 `terms_agreed_at = now()`를 기록한다. 시각은 클라이언트 값을 쓰지 않는다.
- `terms_version`은 메타데이터 값을 `left(..., 20)`으로 잘라 기록한다. 플래그가 없으면 null.
- 우리 화면을 거치지 않고 Supabase API로 직접 가입하면 플래그가 없어 동의 값이 null로 남는다. 막을 수는 없지만 구분은 된다.

### 1-3. 동의 값 보호

`users_update_own` 정책은 본인 행의 모든 컬럼 수정을 허용한다. 테이블 단위 UPDATE 권한이 있으면 컬럼 단위 `revoke`는 효과가 없으므로, 두 동의 컬럼이 바뀌면 예외를 던지는 `BEFORE UPDATE` 트리거(`prevent_terms_consent_update`)를 둔다. 가입 트리거는 INSERT라 영향을 받지 않는다.

### 1-4. 계정 삭제 함수

```sql
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
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
```

- 로그인 확인에 더해 JWT `amr`에 최근 5분 안의 `password` 인증이 있어야 한다. 세션 토큰만으로 rpc를 직접 불러 비밀번호 재확인을 건너뛰지 못하게 한다(최종 리뷰 반영).
- 사용자 기록 8개 테이블(`scraped_feeds`, `scraped_quotes`, `quiz_results`, `daily_activities`, `feed_reads`, `writing_drafts`, `writing_bookmarks`, `cs_reviews`)과 `users` 행은 `auth.users` 삭제 시 `on delete cascade`로 함께 지워진다.
- 다른 사용자가 내 공개 글을 북마크한 행은 `writing_bookmarks.draft_id` cascade로 함께 지워진다.

### 운영 적용 순서

1. migration을 운영 DB에 적용한다 (사용자 승인 후).
2. 앱을 배포한다.

앱을 먼저 배포하면 탈퇴 API의 rpc 호출이 실패하고, 가입 동의 값이 저장되지 않는다(가입 자체는 성공). 릴리스 PR 병합 전에 적용을 완료한다.

## 2. 회원 탈퇴

### API: `DELETE /api/account`

요청 본문: `{ "password": string }`

| 순서 | 처리 | 실패 응답 |
| --- | --- | --- |
| 1 | `auth.getUser()` | 로그인 안 됨 → `unauthorized()` |
| 2 | 본문 파싱, `password`가 비어 있지 않은 문자열인지 | `badRequest("비밀번호를 입력해 주세요.")` |
| 3 | `auth.signInWithPassword({ email: user.email, password })`로 검증 | 시도 제한(status 429) → `badRequest("시도가 많습니다. 잠시 후 다시 시도해 주세요.")`, 그 밖의 실패 → `badRequest("비밀번호가 일치하지 않습니다.")` |
| 4 | `storage.from("avatars").list("", { search: user.id })` 후 이름이 `${user.id}-`로 시작하는 파일 `remove`, 지운 파일이 있으면 `users.avatar_url`을 null로 갱신 | 실패 → `serverError(고정 문구, 원본)` 계정은 지우지 않는다 |
| 5 | `rpc("delete_own_account")` | 실패 → `serverError(고정 문구, 원본)` |
| 6 | `auth.signOut()` | 실패해도 무시한다 (계정은 이미 삭제됨, 세션은 무효) |
| 7 | `200 { deleted: true }` | — |

- 프로필 이미지는 계정 삭제 **전에** 지운다. 계정을 먼저 지우면 세션이 무효가 되어 Storage RLS(본인 파일만 삭제)를 통과할 수 없다.
- 4단계 이후 5단계가 실패하면 프로필 이미지만 지워진 상태가 된다. 다시 시도하면 남은 단계를 이어서 처리한다. 지운 이미지를 가리키는 `avatar_url`이 남으면 `/api/profile`이 깨진 public URL을 만들므로 4단계에서 함께 비운다.
- 반복 요청: 이미 삭제된 뒤에는 세션이 없어 1단계에서 401이다.
- 비밀번호 대입 시도는 Supabase Auth의 로그인 rate limit을 따른다.

### UI: 프로필 하단 "회원 탈퇴"

- 프로필 페이지 맨 아래(탭 콘텐츠 다음)에 구분선과 함께 둔다. 자주 쓰는 설정 카드와 떨어뜨려 실수로 누르지 않게 한다.
- 처음에는 설명 한 줄과 `회원 탈퇴` 버튼만 보인다. 누르면 같은 자리에 확인 폼이 펼쳐진다.
  - 안내: 읽은 글, 스크랩, 퀴즈·CS 기록, 작성한 글이 모두 삭제되고 복구할 수 없다.
  - 비밀번호 입력, `취소`, `탈퇴하기` 버튼
- 상태: 닫힘 → 입력 → 요청 중(버튼 비활성, "탈퇴 처리 중...") → 실패(서버 문구를 `role="alert"`로 표시, 입력 유지) / 성공
- 성공 시 인증 스토어 초기화, TanStack Query 캐시 전체 비우기, 홈으로 이동(`router.replace`).
- 색상은 `destructive` 토큰을 쓰고 아이콘·문구로 위험을 함께 전달한다.

## 3. 가입 동의 절차

### UI (`SignUpForm`)

가입 버튼 위에 필수 체크박스 두 개를 둔다.

- `[ ] 만 14세 이상입니다. (필수)`
- `[ ] 이용약관과 개인정보처리방침에 동의합니다. (필수)` — 두 문서 이름은 새 탭 링크
- 두 항목을 모두 체크해야 가입 버튼이 활성화된다. 클라이언트 상태와 별개로 서버도 검증한다.

### 서버 액션 (`signup`)

- `formData`의 `ageConfirmed`, `termsAgreed`가 모두 `"on"`이 아니면 `{ error: "만 14세 이상 확인과 약관 동의가 필요합니다." }`.
- `signUp` 메타데이터에 `terms_agreed: true`, `terms_version: POLICY_EFFECTIVE_DATE`를 넣는다.

### 약관 버전 상수

`src/config/policy.ts`에 `POLICY_EFFECTIVE_DATE = "2026-10-13"`과 표시용 `formatPolicyDate()`("2026년 10월 13일")를 두고, 이용약관·개인정보처리방침 페이지의 시행일 표시와 가입 메타데이터가 같은 값을 쓴다.

## 4. 정책 문서와 README

- 개인정보처리방침
  - 처리 항목에 "약관 동의 일시와 동의한 약관 버전" 추가
  - 이용자 권리: "회원 탈퇴 기능은 아직 없습니다" → "프로필 화면의 회원 탈퇴에서 비밀번호를 확인한 뒤 즉시 삭제할 수 있습니다"
  - 파기: 탈퇴 즉시 계정, 기록, 프로필 이미지가 삭제됨
- 이용약관
  - 회원 계정: 가입 시 만 14세 이상 확인과 약관 동의, 직접 탈퇴 방법
  - 첫머리의 "이용하면 동의한 것으로 본다" 문구는 비회원 이용을 위해 유지
- README
  - 주요 기능(프로필): 회원 탈퇴, 가입 동의
  - 주요 테이블: `users` 설명에 동의 기록
  - 주요 함수: `delete_own_account`

## 5. 테스트

- 테스트 헬퍼 확장(`src/test/fakeSupabase.ts`, `docs/testing-guide.md`): `auth.signInWithPassword`, `auth.signOut`, `storage.list`
- `DELETE /api/account` route 테스트: 401, 빈 비밀번호 400, 틀린 비밀번호 400(삭제 호출 없음), 이미지 삭제 실패 500(rpc 호출 없음), rpc 실패 500(고정 문구), 정상(이미지 → avatar_url null → rpc → signOut 순서, 남의 파일 미삭제)
- 탈퇴 폼 컴포넌트 테스트: 펼침/취소, 빈 비밀번호 버튼 비활성, 실패 문구 표시와 입력 유지, 성공 시 캐시 비움·홈 이동
- 가입: 서버 액션 동의 누락 거부와 메타데이터 포함 검증, 폼 체크박스에 따른 버튼 활성 상태
- migration은 로컬 Supabase가 없어 SQL 리뷰와 운영 적용 후 확인으로 검증한다.

## 6. 이슈 구성 (v1.12.0)

1. DB: 계정 삭제 함수와 가입 동의 컬럼 migration (파일 추가만, 운영 적용은 릴리스 전 별도 승인)
2. 회원 탈퇴 API와 프로필 UI, 테스트 헬퍼 확장, 정책 문구
3. 가입 동의 절차, 약관 버전 상수, 정책 문구
4. 릴리스 관리 이슈

2와 3은 1의 migration이 운영에 적용돼야 Production에서 동작한다. 코드 병합은 migration 파일 병합 후 진행하고, Production 배포(릴리스 병합)는 운영 적용 후에 한다.

## 위험과 대응

| 위험 | 대응 |
| --- | --- |
| Preview 배포가 운영 DB를 쓰면 탈퇴 테스트가 실제 계정을 지운다 | Preview에서 탈퇴를 시험하지 않는다. 운영 확인은 전용 테스트 계정으로만 한다. |
| migration 적용 전 배포 | 릴리스 체크리스트에 적용 확인을 두고 릴리스 PR 병합 전에 완료한다. |
| 프로필 이미지 삭제 후 계정 삭제 실패 | `avatar_url`을 먼저 비워 깨진 이미지를 막고, 재시도로 이어서 처리한다. |
