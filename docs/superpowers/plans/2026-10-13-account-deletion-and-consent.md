# 회원 직접 탈퇴와 가입 동의 절차 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원이 프로필에서 비밀번호를 확인한 뒤 직접 탈퇴하고, 회원가입 때 만 14세 이상 확인과 약관·개인정보처리방침 동의를 필수로 받아 기록한다.

**Architecture:** 계정 삭제는 본인 계정만 지우는 `security definer` 함수 `delete_own_account()`를 사용자 세션으로 호출한다. 기록 테이블은 기존 `on delete cascade`로 함께 지워지고, Storage 프로필 이미지는 계정 삭제 전에 Storage API로 지운다. 동의는 가입 서버 액션이 메타데이터 플래그를 넘기고 `handle_new_user` 트리거가 DB 시각으로 기록한다.

**Tech Stack:** Next.js App Router, Supabase(Auth, Postgres, Storage), TanStack Query, Zustand, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-10-13-account-deletion-and-consent-design.md`

## Global Constraints

- 오류 응답은 `src/utils/apiResponse.ts`의 `unauthorized`, `badRequest`, `serverError`만 쓴다. 500에는 고정 문구만 담는다.
- 인증 실패 문구는 `AUTH_REQUIRED_MESSAGE`("인증이 필요합니다.").
- 계정 삭제 순서: 비밀번호 검증 → 프로필 이미지 삭제 → `avatar_url` null → `delete_own_account` → `signOut`.
- 약관 버전 값은 `POLICY_EFFECTIVE_DATE = "2026-10-13"` 하나만 쓴다.
- 서비스 롤 키를 추가하지 않는다.
- 색상은 `globals.css` 역할 기반 토큰만 쓴다(`destructive` 등).
- migration 파일 추가와 운영 적용은 별개다. 운영 적용은 사용자 승인 후, 릴리스 PR 병합 전에 한다.
- 한 이슈 = 한 브랜치 = 한 PR, base는 `develop`. 커밋 메시지는 Conventional Commits + 이슈 번호.
- 커밋마다 `npm run lint`, `npm run type-check`, `npm test`, PR 전 `npm run build`(CI placeholder 환경 변수).

## Review Focus

1. 비밀번호 시도 제한(Supabase 429)에 걸린 사용자 → "비밀번호가 일치하지 않습니다"가 아니라 잠시 후 다시 시도하라는 안내를 받는다. (Task 2에 테스트)
2. 프로필 이미지가 없는 사용자 → Storage `remove`와 `avatar_url` 갱신 없이 바로 계정이 삭제된다. (Task 2에 테스트)
3. `avatars` 검색 결과에 접두사만 비슷한 다른 사용자 파일(`u10-...`이 `u1` 검색에 잡힘) → 본인 파일만 지운다. (Task 2에 테스트)
4. 탈퇴 요청 중 버튼 연타 → 요청은 한 번만 나간다. (Task 3에 테스트)
5. 가입 화면을 거치지 않고 체크 값 없이 서버 액션을 부른 요청 → 가입하지 않고 동의 필요 문구를 돌려준다. (Task 4에 테스트)

---

## 이슈와 브랜치

| 이슈 | 브랜치 | Task |
| --- | --- | --- |
| A. 계정 삭제 함수와 가입 동의 컬럼 migration | `chore/206-account-deletion-migration` | Task 1 (스펙·계획 문서 포함) |
| B. 회원 탈퇴 API와 프로필 UI | `feat/207-account-deletion` | Task 2, Task 3 |
| C. 가입 동의 절차 | `feat/208-signup-consent` | Task 4, Task 5 |
| 릴리스 v1.12.0 | `chore/205-release-v1.12.0` | Task 6 |

---

### Task 1: migration 파일

**Files:**
- Create: `supabase/migrations/20261013090000_add_account_deletion_and_consent.sql`
- Add: `docs/superpowers/specs/2026-10-13-account-deletion-and-consent-design.md`, `docs/superpowers/plans/2026-10-13-account-deletion-and-consent.md`

**Interfaces:**
- Produces: `public.users.terms_agreed_at timestamptz`, `public.users.terms_version text`, `public.delete_own_account() returns void` (authenticated만 실행), 트리거가 읽는 메타데이터 키 `terms_agreed`(boolean), `terms_version`(string)

- [ ] **Step 1: migration 작성**

```sql
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

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
```

- [ ] **Step 2: SQL 점검**

로컬 Supabase가 없으므로 눈으로 확인한다.
- 기존 `handle_new_user`(initial_schema 74~89행)의 `insert` 컬럼·`on conflict` 동작이 그대로인지
- 기존 트리거 `on_auth_user_created`는 함수만 바뀌므로 다시 만들 필요가 없는지
- 사용자 기록 8개 테이블의 `user_id`가 모두 `references auth.users(id) on delete cascade`인지: `grep -n "user_id uuid" supabase/migrations/*.sql`

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20261013090000_add_account_deletion_and_consent.sql docs/superpowers/specs docs/superpowers/plans
git commit -m "chore: 계정 삭제 함수와 가입 동의 컬럼 migration 추가 (#206)"
```

PR 본문에 "파일 추가만, 운영 적용은 릴리스 전 별도 승인"을 명시한다.

---

### Task 2: `DELETE /api/account`와 테스트 헬퍼 확장

**Files:**
- Modify: `src/test/fakeSupabase.ts`, `src/test/fakeSupabase.test.ts`, `docs/testing-guide.md`
- Create: `src/app/api/account/route.ts`, `src/app/api/account/route.test.ts`

**Interfaces:**
- Consumes: `delete_own_account` rpc (Task 1)
- Produces: `DELETE /api/account` 요청 `{ password: string }` → 200 `{ deleted: true }` / 400·401·500 `{ error: string }`
- Produces (테스트 헬퍼): `FakeSupabaseOptions.auth.signInWithPassword|signOut|signUp`, `FakeSupabaseOptions.storage.list`, `FakeSupabase.authCalls()`, `StorageCall`의 `{ op: "list", path, options }`

- [ ] **Step 1: 헬퍼 테스트 작성** (`src/test/fakeSupabase.test.ts`에 추가)

```ts
describe("auth 쓰기 메서드", () => {
  it("signInWithPassword·signUp·signOut 응답을 주입하고 호출을 기록한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1", email: "a@b.c" },
      auth: {
        signInWithPassword: { error: { message: "Invalid login credentials", status: 400 } },
        signUp: { data: { user: { id: "u2" } } },
        signOut: {},
      },
    });

    const signIn = await fake.client.auth.signInWithPassword({ email: "a@b.c", password: "x" });
    const signUp = await fake.client.auth.signUp({ email: "n@b.c", password: "y", options: { data: { a: 1 } } });
    const signOut = await fake.client.auth.signOut();

    expect(signIn.error).toEqual({ message: "Invalid login credentials", status: 400 });
    expect(signUp.data).toEqual({ user: { id: "u2" } });
    expect(signOut.error).toBeNull();
    expect(fake.authCalls()).toEqual([
      { op: "signInWithPassword", args: { email: "a@b.c", password: "x" } },
      { op: "signUp", args: { email: "n@b.c", password: "y", options: { data: { a: 1 } } } },
      { op: "signOut", args: undefined },
    ]);
  });
});

describe("storage.list", () => {
  it("주입한 목록을 돌려주고 호출을 기록한다", async () => {
    const fake = fakeSupabase({ storage: { list: { data: [{ name: "u1-a.png" }] } } });

    const { data } = await fake.client.storage.from("avatars").list("", { search: "u1" });

    expect(data).toEqual([{ name: "u1-a.png" }]);
    expect(fake.storageCalls()).toEqual([
      { bucket: "avatars", op: "list", path: "", options: { search: "u1" } },
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/fakeSupabase.test.ts` → `signInWithPassword is not a function` 등으로 FAIL

- [ ] **Step 3: 헬퍼 구현** (`src/test/fakeSupabase.ts`)

타입 추가:

```ts
export type StorageCall =
  | { bucket: string; op: "upload"; path: string }
  | { bucket: string; op: "remove"; paths: string[] }
  | { bucket: string; op: "list"; path: string; options?: unknown }
  | { bucket: string; op: "getPublicUrl"; path: string };

export type AuthCall = {
  op: "signInWithPassword" | "signUp" | "signOut";
  args: unknown;
};

type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  /** Auth 오류의 HTTP 상태. 시도 제한(429)을 구분할 때 쓴다. */
  status?: number;
};

export type FakeSupabaseOptions = {
  user?: FakeUser | null;
  from?: Record<string, FakeResult | FakeResult[]>;
  rpc?: Record<string, FakeResult | FakeResult[]>;
  auth?: {
    signInWithPassword?: FakeResult | FakeResult[];
    signUp?: FakeResult | FakeResult[];
    signOut?: FakeResult | FakeResult[];
  };
  storage?: {
    upload?: FakeResult | FakeResult[];
    remove?: FakeResult | FakeResult[];
    list?: FakeResult | FakeResult[];
  };
};
```

`FakeClient.auth`와 `storage.from()` 반환 타입에 메서드를 더한다.

```ts
type FakeClient = {
  auth: {
    getUser(): Promise<{ data: { user: FakeUser | null }; error: null }>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<FakeResponse>;
    signUp(args: unknown): Promise<FakeResponse>;
    signOut(): Promise<FakeResponse>;
  };
  from(table: string): QueryBuilder;
  rpc(name: string, args?: unknown): Promise<FakeResponse>;
  storage: {
    from(bucket: string): {
      upload(path: string, file: unknown, options?: unknown): Promise<FakeResponse>;
      remove(paths: string[]): Promise<FakeResponse>;
      list(path: string, options?: unknown): Promise<FakeResponse>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
};

export type FakeSupabase = {
  client: FakeClient;
  calls(table: string): FakeCall[];
  rpcCalls(name: string): unknown[];
  storageCalls(): StorageCall[];
  authCalls(): AuthCall[];
};
```

`fakeSupabase()` 안:

```ts
  const authCalls: AuthCall[] = [];
  const takeSignIn = createQueue(options.auth?.signInWithPassword, `"auth.signInWithPassword"`);
  const takeSignUp = createQueue(options.auth?.signUp, `"auth.signUp"`);
  const takeSignOut = createQueue(options.auth?.signOut, `"auth.signOut"`);
  const takeList = createQueue(options.storage?.list, `"storage.list"`);
```

`client.auth`:

```ts
    auth: {
      getUser: async () => ({ data: { user: options.user ?? null }, error: null }),
      signInWithPassword: async (credentials) => {
        authCalls.push({ op: "signInWithPassword", args: credentials });
        return toResponse(takeSignIn(), "await");
      },
      signUp: async (args) => {
        authCalls.push({ op: "signUp", args });
        return toResponse(takeSignUp(), "await");
      },
      signOut: async () => {
        authCalls.push({ op: "signOut", args: undefined });
        return toResponse(takeSignOut(), "await");
      },
    },
```

`storage.from()`에 추가:

```ts
        list: async (path, listOptions) => {
          const result = takeList();
          storageCalls.push({ bucket, op: "list", path, options: listOptions });
          return toResponse(result, "await");
        },
```

반환 객체에 `authCalls: () => authCalls` 추가.

`docs/testing-guide.md`의 지원 메서드 표에 다음 행을 추가한다.

```md
| `auth` | `auth.signInWithPassword()` / `.signUp()` / `.signOut()` — `auth` 옵션으로 응답 주입, `authCalls()`로 호출 확인 |
| `storage` | `storage.from(bucket).list()` — `storage.list` 옵션으로 응답 주입 |
```

- [ ] **Step 4: 헬퍼 테스트 통과 확인** — `npx vitest run src/test/fakeSupabase.test.ts` → PASS

- [ ] **Step 5: route 테스트 작성** (`src/app/api/account/route.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const USER = { id: "u1", email: "user@example.com" };
const FAILED = "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const request = (body?: unknown) => jsonRequest("DELETE", "/api/account", body);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("DELETE /api/account", () => {
  it("비로그인 요청은 401", async () => {
    installSupabaseMock(fakeSupabase({ user: null }).client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it.each([[undefined], [{}], [{ password: "" }], [{ password: 123 }]])(
    "비밀번호가 없으면 400 (%j)",
    async (body) => {
      const fake = fakeSupabase({ user: USER });
      installSupabaseMock(fake.client);

      const response = await DELETE(request(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "비밀번호를 입력해 주세요." });
      expect(fake.authCalls()).toEqual([]);
    }
  );

  it("비밀번호가 틀리면 400이고 아무것도 지우지 않는다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: { error: { message: "Invalid login credentials", status: 400 } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "wrong" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "비밀번호가 일치하지 않습니다." });
    expect(fake.storageCalls()).toEqual([]);
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("시도 제한(429)이면 다시 시도하라고 안내한다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: { error: { message: "rate limit", status: 429 } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "시도가 많습니다. 잠시 후 다시 시도해 주세요.",
    });
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("프로필 이미지 삭제에 실패하면 500이고 계정은 지우지 않는다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {} },
      storage: { list: { data: [{ name: "u1-a.png" }] }, remove: { error: { message: "storage down" } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: FAILED });
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("계정 삭제 rpc가 실패하면 500과 고정 문구만 준다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {} },
      storage: { list: { data: [] } },
      rpc: { delete_own_account: { error: { message: "permission denied for table users" } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: FAILED });
  });

  it("이미지가 없으면 Storage를 건드리지 않고 계정을 지운다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {}, signOut: {} },
      storage: { list: { data: [] } },
      rpc: { delete_own_account: {} },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(fake.storageCalls().map((call) => call.op)).toEqual(["list"]);
    expect(fake.calls("users")).toEqual([]);
  });

  it("본인 이미지만 지우고 avatar_url을 비운 뒤 계정을 지우고 로그아웃한다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {}, signOut: {} },
      storage: {
        list: { data: [{ name: "u1-a.png" }, { name: "u10-b.png" }, { name: "u1-c.webp" }] },
        remove: {},
      },
      from: { users: {} },
      rpc: { delete_own_account: {} },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(200);
    expect(fake.authCalls()).toEqual([
      { op: "signInWithPassword", args: { email: "user@example.com", password: "pw" } },
      { op: "signOut", args: undefined },
    ]);
    expect(fake.storageCalls()).toEqual([
      { bucket: "avatars", op: "list", path: "", options: { search: "u1" } },
      { bucket: "avatars", op: "remove", paths: ["u1-a.png", "u1-c.webp"] },
    ]);
    expect(fake.calls("users")).toEqual([
      expect.objectContaining({
        op: "update",
        payload: { avatar_url: null },
        filters: [["eq", "id", "u1"]],
      }),
    ]);
    expect(fake.rpcCalls("delete_own_account")).toHaveLength(1);
  });
});
```

- [ ] **Step 6: 실패 확인** — `npx vitest run src/app/api/account/route.test.ts` → `Cannot find module './route'`로 FAIL

- [ ] **Step 7: route 구현** (`src/app/api/account/route.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { badRequest, serverError, unauthorized } from "@/utils/apiResponse";

const AVATAR_BUCKET = "avatars";
const DELETE_FAILED_MESSAGE =
  "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * 본인 계정을 지운다. 순서가 중요하다.
 * 1. 비밀번호를 다시 확인한다.
 * 2. 프로필 이미지를 지운다. 계정을 먼저 지우면 세션이 무효가 되어 Storage RLS를 통과하지 못한다.
 * 3. delete_own_account가 auth.users를 지우고, 기록 테이블은 on delete cascade로 함께 지워진다.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return badRequest("비밀번호를 입력해 주세요.");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password,
  });
  if (signInError) {
    return badRequest(
      signInError.status === 429
        ? "시도가 많습니다. 잠시 후 다시 시도해 주세요."
        : "비밀번호가 일치하지 않습니다."
    );
  }

  const avatars = supabase.storage.from(AVATAR_BUCKET);
  const { data: files, error: listError } = await avatars.list("", {
    search: user.id,
  });
  if (listError) return serverError(DELETE_FAILED_MESSAGE, listError);

  // search는 부분 일치라 u1 검색에 u10의 파일도 잡힌다. 저장 규칙(`{id}-{uuid}.{ext}`)으로 다시 거른다.
  const ownPaths = (files ?? [])
    .map((file) => file.name)
    .filter((name) => name.startsWith(`${user.id}-`));

  if (ownPaths.length > 0) {
    const { error: removeError } = await avatars.remove(ownPaths);
    if (removeError) return serverError(DELETE_FAILED_MESSAGE, removeError);

    // 계정 삭제가 실패해도 지운 파일을 가리키는 주소가 남지 않게 먼저 비운다.
    const { error: clearError } = await supabase
      .from("users")
      .update({ avatar_url: null })
      .eq("id", user.id);
    if (clearError) return serverError(DELETE_FAILED_MESSAGE, clearError);
  }

  const { error: deleteError } = await supabase.rpc("delete_own_account");
  if (deleteError) return serverError(DELETE_FAILED_MESSAGE, deleteError);

  // 계정이 이미 지워졌으므로 로그아웃 실패는 응답에 영향을 주지 않는다. 쿠키만 정리한다.
  await supabase.auth.signOut();

  return NextResponse.json({ deleted: true });
}
```

- [ ] **Step 8: 통과 확인** — `npx vitest run src/app/api/account src/test` → PASS

- [ ] **Step 9: 전체 검증과 커밋**

```bash
npm run lint && npm run type-check && npm test
git add src/test/fakeSupabase.ts src/test/fakeSupabase.test.ts docs/testing-guide.md src/app/api/account
git commit -m "feat: 회원 탈퇴 API 추가 (#207)"
```

---

### Task 3: 프로필 회원 탈퇴 UI와 정책 문구

**Files:**
- Create: `src/components/profile/AccountDeletionSection.tsx`, `src/components/profile/AccountDeletionSection.test.tsx`
- Modify: `src/components/profile/ProfileContainer.tsx` (탭 콘텐츠 다음에 렌더링), `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `README.md`

**Interfaces:**
- Consumes: `DELETE /api/account` (Task 2), `useAuthStore().clearAuth()`, `ROUTE_PATH.HOME`

- [ ] **Step 1: 컴포넌트 테스트 작성**

```tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountDeletionSection from "./AccountDeletionSection";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import { useAuthStore } from "@/stores/authStore";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const openButton = () => screen.getByRole("button", { name: "회원 탈퇴" });
const submitButton = () => screen.getByRole("button", { name: "탈퇴하기" });
const passwordInput = () => screen.getByLabelText("비밀번호 확인");

beforeEach(() => {
  replace.mockReset();
  signInTestUser();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

describe("AccountDeletionSection", () => {
  it("버튼을 누르면 확인 폼이 열리고 취소하면 닫히며 입력이 지워진다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByLabelText("비밀번호 확인")).toBeNull();
    await user.click(openButton());
    expect(passwordInput()).toHaveValue("");
  });

  it("비밀번호를 입력하기 전에는 탈퇴 버튼이 비활성이다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());

    expect(submitButton()).toBeDisabled();
  });

  it("실패하면 서버 문구를 알리고 입력을 유지한다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "비밀번호가 일치하지 않습니다." }),
      })
    );
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "wrong");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("비밀번호가 일치하지 않습니다.");
    expect(passwordInput()).toHaveValue("wrong");
    expect(replace).not.toHaveBeenCalled();
  });

  it("성공하면 로그인 정보와 캐시를 비우고 홈으로 이동한다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { queryClient } = renderWithQuery(<AccountDeletionSection />);
    queryClient.setQueryData(["profile"], { nickname: "a" });

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(submitButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/account");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ password: "pw" });
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
  });

  it("요청 중에는 버튼을 다시 눌러도 한 번만 요청한다", async () => {
    const user = userEvent.setup();
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)));
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(submitButton());
    const pending = screen.getByRole("button", { name: "탈퇴 처리 중..." });
    expect(pending).toBeDisabled();
    await user.click(pending);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ deleted: true }) });
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/components/profile/AccountDeletionSection.test.tsx` → 모듈 없음 FAIL

- [ ] **Step 3: 컴포넌트 구현** (`src/components/profile/AccountDeletionSection.tsx`)

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";

const PASSWORD_INPUT_ID = "account-deletion-password";

export default function AccountDeletionSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "회원 탈퇴를 처리하지 못했습니다.");
      }
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.replace(ROUTE_PATH.HOME);
    },
  });

  const close = () => {
    setOpen(false);
    setPassword("");
    mutation.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <section aria-labelledby="account-deletion-title" className="mt-16 border-t pt-8">
      <h2 id="account-deletion-title" className="text-lg font-bold text-foreground">
        회원 탈퇴
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        탈퇴하면 계정과 모든 학습 기록이 즉시 삭제됩니다.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          회원 탈퇴
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4 rounded-lg border border-destructive/40 p-5">
          <p className="flex gap-2 text-sm text-foreground">
            <FiAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            읽은 글, 스크랩, 퀴즈·CS 기록, 작성한 글이 모두 삭제되고 복구할 수 없어요.
          </p>
          <div className="space-y-2">
            <Label htmlFor={PASSWORD_INPUT_ID}>비밀번호 확인</Label>
            <Input
              id={PASSWORD_INPUT_ID}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close} disabled={mutation.isPending}>
              취소
            </Button>
            <Button type="submit" variant="destructive" disabled={!password || mutation.isPending}>
              {mutation.isPending ? "탈퇴 처리 중..." : "탈퇴하기"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
```

`Button`에 `destructive`·`outline`·`ghost` variant가 있는지 `src/components/ui/button.tsx`에서 확인하고, 없는 variant는 `variant` 없이 같은 토큰 클래스로 대체한다.

- [ ] **Step 4: 통과 확인** — `npx vitest run src/components/profile/AccountDeletionSection.test.tsx` → PASS

- [ ] **Step 5: 프로필에 배치** (`src/components/profile/ProfileContainer.tsx`)

```tsx
import AccountDeletionSection from "@/components/profile/AccountDeletionSection";
// ...
      <ProfileTabs activeTab={activeTab} handleChangeTab={handleChangeTab} />
      <div>{renderActiveTab}</div>
      <AccountDeletionSection />
```

- [ ] **Step 6: 정책 문구 수정**

`src/app/privacy/page.tsx`
- "3. 보유 기간": `회원 탈퇴(계정 삭제)를 요청할 때까지 보관하며, 요청을 받으면 지체 없이 파기합니다.` → `회원 탈퇴(계정 삭제) 때까지 보관하며, 탈퇴하면 즉시 파기합니다.`
- "6. 파기 절차와 방법": `계정을 삭제하면` → `회원 탈퇴로 계정을 삭제하면`
- "7. 이용자의 권리와 행사 방법"의 두 번째 문단 전체를 다음으로 교체:

```tsx
            <p>
              회원 탈퇴는 프로필 화면 맨 아래의 회원 탈퇴에서 비밀번호를 확인한
              뒤 즉시 처리됩니다. 로그인할 수 없는 경우에는 가입한 이메일로{" "}
              <ContactLink />에 요청해 주세요. 본인 확인 후 지체 없이
              처리합니다.
            </p>
```

`src/app/terms/page.tsx` "2. 회원 계정"의 세 번째 항목을 교체:

```tsx
              <li>
                회원 탈퇴는 프로필 화면에서 비밀번호를 확인한 뒤 직접 할 수
                있으며, 탈퇴하면 계정과 기록이 즉시 삭제됩니다. 개인정보 처리는{" "}
                <Link href={ROUTE_PATH.PRIVACY} className={linkClassName}>
                  개인정보처리방침
                </Link>
                을 따릅니다.
              </li>
```

- [ ] **Step 7: README** — `### 프로필과 학습 통계`에 `- **회원 탈퇴**: 비밀번호를 확인한 뒤 계정, 모든 기록, 프로필 이미지를 즉시 삭제` 추가. `### 주요 함수` 표에 `| \`delete_own_account\` | 로그인한 본인 계정 삭제 (기록은 cascade로 함께 삭제) |` 추가.

- [ ] **Step 8: 검증과 커밋**

```bash
npm run lint && npm run type-check && npm test
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-anon-key npm run build
git add src/components/profile src/app/privacy/page.tsx src/app/terms/page.tsx README.md
git commit -m "feat: 프로필에 회원 탈퇴 추가 (#207)"
```

화면 확인: 로컬 프로덕션 서버는 Supabase가 없어 프로필이 비로그인 상태다. 컴포넌트를 1280px·320px로 확인할 수 없으면 PR에 명시하고 Production에서 테스트 계정으로 확인한다. **Preview에서 실제 탈퇴를 시험하지 않는다.**

---

### Task 4: 약관 버전 상수와 가입 서버 액션

**Files:**
- Create: `src/config/policy.ts`, `src/config/policy.test.ts`, `src/app/signup/action.test.ts`
- Modify: `src/app/signup/action.ts`, `src/config/constants.ts` (`FORM_DATA`), `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`

**Interfaces:**
- Produces: `POLICY_EFFECTIVE_DATE: "2026-10-13"`, `formatPolicyDate(date?: string): string`, `FORM_DATA.AGE_CONFIRMED = "ageConfirmed"`, `FORM_DATA.TERMS_AGREED = "termsAgreed"`, `CONSENT_REQUIRED_MESSAGE`
- Consumes: 트리거 메타데이터 키 `terms_agreed`, `terms_version` (Task 1), 헬퍼 `auth.signUp` (Task 2)

- [ ] **Step 1: 상수 테스트** (`src/config/policy.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { POLICY_EFFECTIVE_DATE, formatPolicyDate } from "./policy";

describe("policy", () => {
  it("시행일은 YYYY-MM-DD 형식이다", () => {
    expect(POLICY_EFFECTIVE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("표시용 날짜를 만든다", () => {
    expect(formatPolicyDate("2026-10-13")).toBe("2026년 10월 13일");
    expect(formatPolicyDate("2027-01-05")).toBe("2027년 1월 5일");
  });
});
```

`src/config/*.test.ts`가 vitest node 프로젝트 include(`src/{utils,services,data}/**`)에 없으면 `vitest.config.ts`의 include에 `"src/config/**/*.test.ts"`를 추가한다.

- [ ] **Step 2: 실패 확인 후 구현** (`src/config/policy.ts`)

```ts
/** 이용약관·개인정보처리방침 시행일. 가입 동의 기록의 약관 버전으로도 쓴다. 내용을 바꾸면 함께 올린다. */
export const POLICY_EFFECTIVE_DATE = "2026-10-13";

export const CONSENT_REQUIRED_MESSAGE =
  "만 14세 이상 확인과 약관 동의가 필요합니다.";

export function formatPolicyDate(date: string = POLICY_EFFECTIVE_DATE): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}
```

두 정책 페이지의 `const EFFECTIVE_DATE = "2026년 10월 13일";`을 `const EFFECTIVE_DATE = formatPolicyDate();`로 바꾸고 `import { formatPolicyDate } from "@/config/policy";`를 추가한다.

- [ ] **Step 3: 서버 액션 테스트** (`src/app/signup/action.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signup } from "./action";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const INITIAL = { user: null, error: "" };

function form(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    nickname: "tester",
    email: "tester@example.com",
    password: "Password1!",
    confirmPassword: "Password1!",
    ageConfirmed: "on",
    termsAgreed: "on",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signup 동의 검증", () => {
  it.each([["ageConfirmed"], ["termsAgreed"]])("%s가 없으면 가입하지 않는다", async (field) => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);

    const result = await signup(INITIAL, form({ [field]: null }));

    expect(result).toEqual({
      user: null,
      error: "만 14세 이상 확인과 약관 동의가 필요합니다.",
    });
    expect(fake.authCalls()).toEqual([]);
  });

  it("동의하면 약관 버전을 메타데이터에 담아 가입한다", async () => {
    const fake = fakeSupabase({
      user: null,
      auth: { signUp: { data: { user: { id: "new" }, session: null } } },
    });
    installSupabaseMock(fake.client);

    const result = await signup(INITIAL, form());

    expect(result.error).toBe("");
    expect(fake.authCalls()).toEqual([
      {
        op: "signUp",
        args: {
          email: "tester@example.com",
          password: "Password1!",
          options: {
            data: { nickname: "tester", terms_agreed: true, terms_version: "2026-10-13" },
          },
        },
      },
    ]);
  });
});
```

비밀번호 규칙(`validatePassword`)에 `Password1!`이 맞지 않으면 `src/utils/authUtils.ts` 기준으로 통과하는 값으로 바꾼다. 테스트 경로 `src/app/signup/**`가 vitest node include에 없으면 `"src/app/signup/**/*.test.ts"`를 추가한다.

- [ ] **Step 4: 실패 확인** — `npx vitest run src/app/signup/action.test.ts` → 동의 누락에도 signUp이 호출되어 FAIL

- [ ] **Step 5: 액션 구현**

`src/config/constants.ts`의 `FORM_DATA`에 추가:

```ts
  AGE_CONFIRMED: "ageConfirmed",
  TERMS_AGREED: "termsAgreed",
```

`src/app/signup/action.ts` (`"use server"` 파일은 async 함수만 export할 수 있어 문구는 `policy.ts`에서 가져온다):

```ts
import { CONSENT_REQUIRED_MESSAGE, POLICY_EFFECTIVE_DATE } from "@/config/policy";
```

`signup()`에서 `validateSignupData` 호출 **전에**:

```ts
  // 체크박스는 체크했을 때만 "on"으로 전송된다. 화면을 거치지 않은 요청도 여기서 막는다.
  const consented =
    formData.get(FORM_DATA.AGE_CONFIRMED) === "on" &&
    formData.get(FORM_DATA.TERMS_AGREED) === "on";
  if (!consented) {
    return { user: null, error: CONSENT_REQUIRED_MESSAGE };
  }
```

`signUp` 옵션:

```ts
    options: {
      data: {
        nickname: data.nickname,
        // 트리거가 이 플래그를 보고 동의 시각을 DB 시각으로 기록한다.
        terms_agreed: true,
        terms_version: POLICY_EFFECTIVE_DATE,
      },
    },
```

- [ ] **Step 6: 통과 확인과 커밋**

```bash
npx vitest run src/config src/app/signup
npm run lint && npm run type-check && npm test
git add src/config src/app/signup src/app/privacy/page.tsx src/app/terms/page.tsx vitest.config.ts
git commit -m "feat: 회원가입 동의를 서버에서 검증하고 기록 (#208)"
```

---

### Task 5: 가입 화면 동의 체크박스와 정책 문구

**Files:**
- Modify: `src/components/auth/SignUpForm.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `README.md`
- Create: `src/components/auth/SignUpForm.test.tsx`

**Interfaces:**
- Consumes: `FORM_DATA.AGE_CONFIRMED`, `FORM_DATA.TERMS_AGREED`, `ROUTE_PATH.TERMS`, `ROUTE_PATH.PRIVACY`

- [ ] **Step 1: 폼 테스트**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./SignUpForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/signup/action", () => ({ signup: vi.fn() }));

describe("SignUpForm 동의", () => {
  it("두 필수 항목을 모두 체크해야 가입 버튼이 활성화된다", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    const submit = screen.getByRole("button", { name: "회원가입" });

    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /만 14세 이상입니다/ }));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /이용약관과 개인정보처리방침에 동의합니다/ }));
    expect(submit).toBeEnabled();
  });

  it("약관과 방침 링크는 새 탭으로 열린다", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("link", { name: /이용약관/ })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /개인정보처리방침/ })).toHaveAttribute("href", "/privacy");
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — 버튼이 처음부터 활성이라 FAIL

- [ ] **Step 3: 구현** — `SignUpForm`에 상태 두 개와 체크박스 추가

```tsx
import Link from "next/link";
// ...
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const consented = ageConfirmed && termsAgreed;
```

오류 Alert 위에:

```tsx
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">필수 동의</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            name={FORM_DATA.AGE_CONFIRMED}
            checked={ageConfirmed}
            onChange={(event) => setAgeConfirmed(event.target.checked)}
            className="size-4 accent-primary"
            required
          />
          만 14세 이상입니다. (필수)
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            name={FORM_DATA.TERMS_AGREED}
            checked={termsAgreed}
            onChange={(event) => setTermsAgreed(event.target.checked)}
            className="size-4 accent-primary"
            required
          />
          <span>
            <Link href={ROUTE_PATH.TERMS} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
              이용약관
            </Link>
            과{" "}
            <Link href={ROUTE_PATH.PRIVACY} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
              개인정보처리방침
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>
      </fieldset>
```

가입 버튼: `disabled={isPending || !consented}`

- [ ] **Step 4: 통과 확인** — `npx vitest run src/components/auth/SignUpForm.test.tsx` → PASS

- [ ] **Step 5: 정책 문구와 README**

`src/app/privacy/page.tsx` "1. 처리하는 개인정보 항목"의 "회원가입 시 필수" 항목 끝에 문장 추가:

```tsx
                : 이메일, 비밀번호, 닉네임, 만 14세 이상 확인과 약관 동의 일시·동의한
                약관 버전. 비밀번호는 인증 서비스가 암호화해 저장하며 운영자도 볼 수
                없습니다.
```

`src/app/terms/page.tsx` "2. 회원 계정" 첫 항목:

```tsx
              <li>
                만 14세 이상이어야 가입할 수 있고, 가입할 때 이 약관과
                개인정보처리방침에 동의해야 합니다. 이메일과 비밀번호로 가입하며,
                계정 정보는 본인이 안전하게 관리해야 합니다.
              </li>
```

README `### 출처와 정책 안내`에 `- **가입 동의**: 회원가입 때 만 14세 이상 확인과 이용약관·개인정보처리방침 동의를 필수로 받고 동의 시각과 약관 버전을 기록` 추가. `### 주요 테이블`의 `users` 설명을 `사용자 프로필, 관심 분야, 하루 읽기 목표, 가입 동의 기록`으로 수정.

- [ ] **Step 6: 검증과 커밋**

```bash
npm run lint && npm run type-check && npm test
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-anon-key npm run build
git add src/components/auth src/app/privacy/page.tsx src/app/terms/page.tsx README.md
git commit -m "feat: 회원가입에 필수 동의 체크박스 추가 (#208)"
```

화면 확인: 로컬 프로덕션 서버에서 `/signup`을 1280px·320px로 캡처해 체크박스 줄바꿈과 터치 영역(44px)을 확인한다.

---

### Task 6: 운영 반영과 릴리스 v1.12.0

- [ ] **Step 1:** A·B·C PR을 `develop`에 병합한다 (CI·Vercel Preview 통과 후). Preview에서 탈퇴를 실행하지 않는다.
- [ ] **Step 2:** **사용자에게 운영 DB migration 적용 승인을 받는다.** 승인 후 `npx supabase migration list --linked`로 pending을 확인하고 `npx supabase db push`로 적용한다. 적용 후 `migration list`에서 원격 반영을 확인한다.
- [ ] **Step 3:** 버전 `1.12.0` 반영 PR → 릴리스 PR(`release: v1.12.0 (#205)`, `Closes #206 #207 #208`, migration 파일명과 적용 완료 기록).
- [ ] **Step 4:** `master` 병합 후 Production 확인
  - `/signup` 체크박스, `/privacy`·`/terms` 문구
  - 사용자가 만든 **전용 테스트 계정**으로 가입 → `users.terms_agreed_at`·`terms_version` 기록 확인 → 프로필 이미지 업로드 → 탈퇴 → 같은 계정 로그인 실패, `avatars`에 파일 없음 확인
- [ ] **Step 5:** 태그 `v1.12.0`, GitHub Release, 릴리스 이슈·마일스톤 종료.
