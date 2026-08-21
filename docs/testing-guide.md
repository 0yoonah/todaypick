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
| `node` | `node` | `src/{utils,services,data}/**/*.test.ts`, `src/app/api/**/*.test.ts`, `src/test/**/*.test.ts` |
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

### 호출 순서와 Promise.all

배열로 주입한 응답은 **빌더가 종단에 도달한 순서**대로 소비됩니다.
`Promise.all`로 여러 조회를 묶어도 배열 요소가 위에서 아래로 평가되며 그 시점에 종단 메서드가 불리므로 순서는 코드에 적힌 순서와 같습니다.

`src/app/api/daily-activities/route.ts`의 GET은 `daily_activities`를 두 번 읽습니다.

```ts
from: {
  daily_activities: [
    { data: null },   // 첫 번째: 해당 날짜 한 건 (maybeSingle)
    { data: [] },     // 두 번째: 스트릭 계산용 전체 목록
  ],
  users: { data: { daily_read_goal: 5 } },
  feed_reads: { count: 2 },
}
```

순서를 잘못 맞추면 배열 소진 오류나 예상과 다른 응답으로 드러납니다. 조용히 넘어가지 않습니다.

### mutation 뒤의 select

`upsert(...).select(...).single()`처럼 변경 뒤에 붙는 `select`는 returning 절이므로 기록된 `op`는 `upsert`로 남습니다.
`select`가 `op`를 덮지 않습니다.

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

`single()`도 비어 있으면 `data: null`을 줍니다.
실제 Supabase가 0행에서 내는 `PGRST116` 오류를 흉내내지 않으므로, 그 경로를 검증하려면 `error`를 직접 주입합니다.
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

### server-only 의존

`src/services/rssFeedService.ts`처럼 `import "server-only"`를 쓰는 모듈을 route가 전이 의존으로 끌고 옵니다.
이 패키지는 Next 번들러만 해석하므로 그냥 두면 `Cannot find package 'server-only'`로 실패합니다.

두 가지로 해결합니다.

- 그 모듈 자체를 모킹한다. 외부 RSS를 다루는 서비스라면 어차피 모킹해야 하므로 이쪽이 먼저다.
- 실제 모듈이 필요하면 `vi.mock("server-only", () => ({}))`를 함께 선언한다. `src/services/rssFeedService.test.ts`가 쓰는 방식이다.

```ts
// 서비스를 모킹하면 server-only도 함께 사라진다.
vi.mock("@/services/rssFeedService", () => ({
  getRSSFeedsWithPagination: vi.fn(),
}));
```

### 요청 만들기

route가 `NextRequest`를 받으므로 실제 인스턴스를 만듭니다. `src/test/apiRequest.ts`를 씁니다.

```ts
const res = await POST(jsonRequest("POST", "/api/cs-reviews", { answer: "" }));
const res = await GET(getRequest("/api/feeds?page=2"));
```

### 오류 응답 검증

500 응답에는 고정 문구만 담고 원본 오류는 로그로만 남깁니다(`src/utils/apiResponse.ts`).
그래서 오류 경로 테스트는 상태 코드와 고정 문구를 확인하고, **주입한 내부 문구가 응답에 없는지**까지 봅니다.

```ts
const { client } = fakeSupabase({
  user: { id: "u1" },
  from: {
    scraped_quotes: {
      error: { code: "42501", message: "permission denied for table scraped_quotes" },
    },
  },
});

const body = await response.json();
expect(response.status).toBe(500);
expect(body).toEqual({ error: "명언을 불러오는데 실패했습니다." });
expect(JSON.stringify(body)).not.toContain("permission denied");
```

`serverError`가 `console.error`로 원본을 남기므로, 테스트 출력이 지저분해지면 `beforeEach`에서 `console.error`를 stub합니다.

### 시각 고정

서울 날짜나 스트릭이 걸린 route는 시각을 고정해야 결과가 안정됩니다.
`Date`만 대체해 프로미스와 타이머 동작을 건드리지 않습니다.

```ts
const FIXED_NOW = new Date("2026-08-21T05:00:00.000Z"); // 서울 2026-08-21 14:00 (금)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});
```

오늘의 퀴즈처럼 날짜로 결정되는 값은 테스트에서도 같은 함수로 계산해 비교합니다.

```ts
const todayQuiz = selectDailyQuiz(quizzes, "2026-08-21", [])!;
```

### 권한 경계 검증과 그 한계

fake는 필터를 실제로 적용하지 않습니다. 그래서 "남의 글이 걸러졌다"를 직접 확인할 수 없습니다.
대신 **소유자 조건이 쿼리에 들어갔는지**를 확인합니다.

```ts
const call = fake.calls("writing_drafts")[0];
expect(call.op).toBe("update");
// 소유자 조건이 빠지면 남의 글을 고칠 수 있다.
expect(call.filters).toEqual([
  ["eq", "id", "d1"],
  ["eq", "user_id", "u1"],
]);
```

이 검증은 **조건을 빼먹는 회귀**를 잡습니다. 실제 행 격리는 DB의 RLS 몫이며 이 테스트가 보장하지 않습니다.
`user_id` 같은 소유자 필드는 클라이언트 입력을 쓰지 않고 서버가 붙이는지도 함께 봅니다.

```ts
// 본문에 남의 id를 넣어도 무시되는지 확인한다.
expect(call.payload).toMatchObject({ user_id: "u1" });
```

### multipart 요청

프로필 이미지나 썸네일처럼 파일을 받는 경로는 `formRequest`를 씁니다.
`content-type`을 직접 지정하면 boundary가 빠져 파싱이 실패하므로 `FormData`가 채우게 둡니다.

```ts
const formData = new FormData();
formData.set("nickname", "윤아");
formData.set("file", new File([new Uint8Array(10)], "a.png", { type: "image/png" }));

const response = await PUT(formRequest("PUT", "/api/profile", formData));
```

### storage

`upload`와 `remove`는 응답을 주입합니다. `getPublicUrl`은 실제 Supabase처럼 동기로 주소만 만들며 주입할 응답이 없습니다.

```ts
expect(body.avatar_url).toBe(`${FAKE_STORAGE_ORIGIN}/avatars/u1-a.png?t=${now}`);
expect(fake.storageCalls()).toEqual([
  { bucket: "avatars", op: "getPublicUrl", path: "u1-a.png" },
]);
```

업로드 경로에 `crypto.randomUUID()`가 들어가는 경우는 값을 고정하지 않고 형태로 확인합니다.

```ts
expect(uploaded.path).toMatch(/^u1-[0-9a-f-]+\.png$/);
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

### 로그인 상태

컴포넌트가 쓰는 훅은 `useAuthStore`의 로그인 여부에 따라 동작이 갈립니다.
`src/test/authState.ts`로 상태만 바꿉니다.

```ts
signInTestUser();       // 기본 id "u1"
signOutTestUser();      // 비로그인
```

`afterEach`에서 `signOutTestUser()`를 불러 다음 테스트로 상태가 넘어가지 않게 합니다.
store는 모듈 수준 싱글턴이라 자동으로 초기화되지 않습니다.

### 라우터와 전역 함수

`useRouter`를 쓰는 컴포넌트는 `next/navigation`을 모킹합니다. 이동이 **몇 번** 일어났는지까지 확인합니다.

```ts
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
expect(push).toHaveBeenCalledWith("/profile?tab=writing");
```

`alert`, `URL.createObjectURL`처럼 jsdom에 없거나 화면을 막는 전역은 `vi.stubGlobal`로 대체하고 `afterEach`에서 `vi.unstubAllGlobals()`합니다.

### 여러 요청을 구분해야 할 때

한 컴포넌트가 조회와 저장을 모두 하면 `fetch` 스텁이 요청을 구분해야 합니다.

```ts
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (init?.method === "POST") return { ok: true, json: async () => submitResponse };
  return { ok: true, json: async () => loadResponse };
});
```

`FormData`로 보내는 경우는 본문을 꺼내 확인합니다.

```ts
const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
const form = init.body as FormData;
expect(init.method).toBe("PUT");
expect(form.get("id")).toBe("d1");
```

### 버튼 이름이 겹칠 때

선택지처럼 문구가 서로 부분 일치하면 `getByRole("button", { name: /내용/ })`이 여러 개를 잡습니다.
접근성 이름의 고정된 접두사로 특정합니다.

```ts
// 버튼 이름은 "A. 내용" 형태다.
screen.getByRole("button", { name: /^A\./ });
```

### 현재 동작을 고정할 때

테스트를 쓰다 의도가 불분명한 동작을 만나면 **고쳐 넣지 않고 현재 동작을 고정한 뒤 이슈로 분리합니다.**
테스트 안에는 무엇을 고정했는지 주석으로 남깁니다.

```ts
// 현재 동작을 그대로 고정한다. 저장된 비공개 설정이 공개로 덮인다.
it("startAsPublic이 함께 오면 저장된 비공개 설정을 덮어쓴다", () => {
```

이렇게 두면 동작을 바꿀 때 어느 테스트를 함께 고쳐야 하는지 이슈에 적을 수 있습니다.

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
