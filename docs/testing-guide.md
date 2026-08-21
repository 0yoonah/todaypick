# 테스트 작성 기준

API route와 컴포넌트 테스트를 **어떤 헬퍼로 어떻게 쓸지** 정한 문서입니다.
새 테스트를 쓰기 전에 이 문서에서 해당하는 절을 먼저 확인합니다.

## 배경

v1.9.0 기준 테스트는 24개 파일 / 241개인데 전부 `src/utils`, `src/services`, `src/data`의 **순수 함수**만 검증했습니다.
`src/app/api` route 11개와 `src/components` 40여 개는 테스트가 0개였습니다.
인증 분기나 컴포넌트 상태 전이가 깨져도 `npm test`가 통과하는 상태였습니다.

## 실행 환경

테스트는 두 프로젝트로 나눠 실행합니다.

| 프로젝트 | environment | 대상 |
| --- | --- | --- |
| `node` | `node` | `src/{utils,services,data}/**/*.test.ts`, `src/app/api/**/*.test.ts` |
| `dom` | `jsdom` | `src/components/**/*.test.tsx` |

**API route 테스트는 `node`입니다.** route는 DOM을 쓰지 않으므로 jsdom에서 돌릴 이유가 없습니다.
`setupFiles`는 `dom` 프로젝트에만 붙입니다.

분리 기준은 `vitest.config.mts` 한 곳에 모여 있습니다.
테스트 파일에 `// @vitest-environment` 주석을 다는 방식은 쓰지 않습니다.
주석을 빼먹으면 `document is not defined`로 실패하는데, 원인이 "단서를 붙여놓는 것 자체를 잊은 것"이라 처음 겪으면 헤매게 됩니다.

`environmentMatchGlobs`는 vitest 4에서 없어졌습니다. `projects`를 씁니다.

## API route 테스트

### Supabase fake

route는 예외 없이 `@/utils/supabase/server`의 `createClient()`만 씁니다.
그래서 이 모듈 하나를 모킹하면 route 11개를 전부 통제할 수 있습니다.

`src/test/fakeSupabase.ts`는 **응답 주입형** fake입니다.
테이블별로 돌려줄 응답을 미리 지정하고, 필터는 실제로 적용하지 않습니다.
대신 어떤 필터로 호출됐는지를 기록으로 남겨 검증합니다.

```ts
const supabase = fakeSupabase({
  user: { id: "u1" },
  from: {
    cs_reviews: { data: [{ question_id: "net-1", score: 40 }] },
  },
});
```

주입할 수 있는 것은 다음과 같습니다.

| 키 | 대응하는 호출 |
| --- | --- |
| `user` | `auth.getUser()`. `null`이면 비로그인 |
| `from` | `from(table)` 이후의 조회·변경 결과 |
| `rpc` | `rpc(name, args)` |
| `storage` | `storage.from(bucket).upload()` / `.remove()` |

반환값은 `{ client, calls, rpcCalls }`입니다.

### 필터는 기록으로 검증한다

필터가 실제로 적용되지 않으므로, 필터가 맞는지는 호출 기록으로 확인합니다.

```ts
expect(supabase.calls("cs_reviews")).toEqual([
  { op: "select", columns: selectFields, filters: [["eq", "user_id", "u1"]] },
]);
```

이 수준을 고른 이유는 테스트의 목적이 **인증 분기, 검증 분기, 오류 분기, 응답 형태**이기 때문입니다.
필터를 진짜로 적용하는 인메모리 fake는 구현량이 크고, 그 구현 자체가 조용히 틀릴 수 있습니다.
"어떤 조건으로 물어봤는가"까지 확인하면 회귀는 충분히 잡힙니다.

집계 결과 자체를 검증해야 한다면 그 계산은 이미 `src/utils`의 순수 함수로 나와 있으므로 그쪽 테스트에서 다룹니다.

### 지원하는 필터와 수정자

route가 실제로 쓰는 것만 지원합니다. 목록에 없는 메서드를 부르면 fake가 명시적으로 실패하게 두어, 표면이 늘어난 것을 조용히 넘기지 않습니다.

| 종류 | 지원 |
| --- | --- |
| 변경 | `insert`, `update`, `upsert`, `delete` |
| 필터 | `eq`, `in`, `gte` |
| 수정자 | `order`, `range` |

### 같은 테이블을 여러 번 읽을 때

한 handler 안에서 같은 테이블을 여러 번 조회하는 route가 있습니다.
`daily-activities`는 `daily_activities`를 6곳에서, `writing-drafts`는 `writing_drafts`를 5곳에서 부릅니다.
응답을 배열로 주면 호출 순서대로 소비됩니다.

```ts
from: {
  daily_activities: [
    { data: [{ date: "2026-08-21" }] },  // 첫 번째 호출
    { count: 3 },                         // 두 번째 호출
  ],
}
```

배열을 다 소비한 뒤 또 호출되면 fake가 실패합니다.
호출 횟수를 잘못 예상한 것을 마지막 응답이 재사용되며 가려지지 않게 하기 위해서입니다.

### 빌더는 불변이다

`src/app/api/writing-drafts/route.ts`는 빌더를 변수에 담아두고 두 갈래로 나눠 각각 await합니다.

```ts
const query = supabase
  .from("writing_drafts")
  .select(selectFields)
  .order("updated_at", { ascending: false });

const { data, error } = user
  ? await query.eq("user_id", user.id)
  : await query.eq("visibility", "public");
```

그래서 fake의 빌더는 **필터나 수정자를 호출할 때마다 새 객체를 반환**하고 누적 배열을 복사합니다.
내부 상태를 누적하는 방식이면 두 갈래의 필터가 섞이거나 두 번째 await이 깨집니다.

이 성질은 `src/test/fakeSupabase.test.ts`에서 위 패턴을 재현해 고정해 둡니다.
헬퍼가 조용히 틀리면 이 헬퍼를 쓰는 모든 테스트가 거짓 초록이 되기 때문에, 헬퍼 자신에게 테스트가 필요합니다.

### 종단 형태

| 호출 | fake 동작 |
| --- | --- |
| `await query` | 주입한 `{ data, error }`를 그대로 반환 |
| `.single()` | `data`를 단일 객체로 축약 |
| `.maybeSingle()` | 비어 있으면 `data: null` |
| `.select(cols, { count: "exact" })` | `count`를 함께 반환 |
| `.select(cols, { count: "exact", head: true })` | `data` 없이 `count`만 반환 |

### 모킹 등록

`vi.mock`은 호이스팅되므로 팩토리 안에서 헬퍼를 부를 수 없습니다.
자동 모킹만 걸고, 주입은 `installSupabaseMock()`으로 합니다.

```ts
vi.mock("@/utils/supabase/server");

const supabase = fakeSupabase({ user: null });
installSupabaseMock(supabase.client);
```

### 요청 만들기

route가 `NextRequest`를 받으므로 실제 인스턴스를 만듭니다. `src/test/apiRequest.ts`를 씁니다.

```ts
const res = await POST(jsonRequest("POST", "/api/cs-reviews", { answer: "" }));
const res = await GET(getRequest("/api/feeds?page=2"));
```

### 각 route에서 덮을 경로

- 비로그인 요청이 401과 규약 문구를 반환한다
- 입력 검증 분기가 400을 반환한다
- Supabase 오류 시 500과 일반 문구를 반환하고 내부 문구가 새지 않는다
- 정상 응답의 형태가 규약과 일치한다
- 소유자가 아닌 사용자의 접근이 차단된다 (해당하는 route)

## 컴포넌트 테스트

### 렌더 헬퍼

TanStack Query를 쓰는 컴포넌트는 `src/test/renderWithQuery.tsx`로 렌더합니다.

```ts
const { queryClient } = renderWithQuery(<TodayQuiz />);
```

테스트마다 **새 `QueryClient`**를 만들고 `retry: false`, `gcTime: 0`으로 둡니다.
공유 클라이언트를 쓰면 테스트 순서에 따라 결과가 바뀌는 실패가 생기는데, 원인을 찾기가 가장 어려운 종류입니다.

### 대상 선정

컴포넌트 전부가 아니라 **상태 전이가 실제로 있는 것**만 테스트합니다.
표시 전용 컴포넌트는 props를 그대로 그리므로 검증 가치가 낮습니다.

상호작용은 `@testing-library/user-event`로 씁니다.
로딩, 오류, 빈 데이터, 비로그인 상태를 함께 확인합니다.

## 파일 배치

| 종류 | 위치 |
| --- | --- |
| 순수 함수 테스트 | 대상 파일 옆 (`src/utils/csUtils.test.ts`) |
| route 테스트 | route 파일 옆 (`src/app/api/cs-reviews/route.test.ts`) |
| 컴포넌트 테스트 | 컴포넌트 파일 옆 (`src/components/TodayQuiz.test.tsx`) |
| 공용 헬퍼 | `src/test/` |

## 관련 문서

- [AGENTS.md](../AGENTS.md) — 필수 검증과 테스트 작성 규칙
