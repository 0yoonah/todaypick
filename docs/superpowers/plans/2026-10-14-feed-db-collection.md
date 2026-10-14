# RSS 예약 수집과 DB 저장 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** RSS를 3시간마다 예약 수집해 `feed_items`에 저장하고, 피드를 DB에서 커서 방식으로 읽으며, 제목 검색을 추가한다.

**Architecture:** pg_cron이 Vercel 수집 API를 부르고, 수집 API는 기존 RSS 수집 코드로 글을 모아 비밀값 확인 함수로 upsert한다. 조회 API는 `feed_items`를 읽어 최신순·맞춤 정렬과 커서를 적용한다. 정렬·커서 규칙은 순수 함수로 분리해 단위 테스트한다.

**Tech Stack:** Next.js App Router route handler, Supabase(Postgres, Vault, pg_cron, pg_net), supabase-js, TanStack Query, Vitest

**Spec:** `docs/superpowers/specs/2026-10-14-feed-db-collection-design.md`

## Global Constraints

- 이슈 하나에 브랜치 하나, base `develop`. 이슈: #220(migration), #221(수집 API), #222(조회 전환), #223(검색), 릴리스 #224
- 오류 응답은 `src/utils/apiResponse.ts` 헬퍼만 쓴다. 500에는 고정 문구, 원본 오류는 두 번째 인자로 넘긴다. 검증 오류는 `TypeError` 문구를 400에 담는다.
- 비밀값을 코드·migration·로그·PR에 넣지 않는다. 서비스 롤 키를 쓰지 않는다.
- 운영 DB migration 적용은 사용자가 한다. 적용하지 않은 migration을 적용했다고 쓰지 않는다.
- 카드 표시 범위(제목 200자, 요약 300자, 이미지 주소, 작성자)는 넓히지 않는다.
- 맞춤 정렬 기간: `tech_blog` 30일, `it_news` 3일. 수집 주기 `5 */3 * * *`. 보관 1년.
- 같은 입력에 같은 순서: 마지막 정렬 키는 `id asc`.
- 검증 명령: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`(env: `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-anon-key`)

## Review Focus

1. 맞춤 모드에서 ①(기간 안)이 페이지 중간에 끝날 때 ②로 이어 채우고, 다음 커서가 ②의 키를 가리키는지. 경계에서 중복·누락이 생기면 사용자는 같은 글을 두 번 보거나 글을 놓친다.
2. 최신순 커서의 `or()` 필터에서 URL id의 따옴표·쉼표 처리. 잘못되면 PostgREST가 400을 내고 "더보기"가 실패한다.
3. 검색어의 `%`, `_`, `\` 이스케이프. 빠지면 `%`만 입력해도 전체 글이 나온다.
4. 수집 API가 발행 시각 없는 글·미래 시각 글·카테고리를 넘는 중복 URL을 걸러내는지. 하나라도 SQL로 넘어가면 upsert 전체가 실패할 수 있다.
5. `upsert_feed_items`가 비밀값 null·빈 Vault에서 거부하는지, 같은 요청 안 중복 id에서 실패하지 않는지.

---

### Task 1 (#220): feed_items migration과 운영 문서

**Files:**
- Create: `supabase/migrations/20261014090000_add_feed_items.sql`
- Create: `docs/feed-collection.md`
- Modify: `README.md` (주요 테이블·함수 표, 문서 목록)
- Add: 이 계획과 설계 문서

**Interfaces:**
- Produces: 테이블 `public.feed_items(id, source_id, category, title, description, image_url, author, interests, published_at, collected_at, updated_at)`, 함수 `public.upsert_feed_items(p_secret text, p_items jsonb) returns jsonb` (`{upserted, deleted}`), cron job `collect-feeds`, Vault 이름 `feed_collector_secret`

- [ ] Step 1: 설계 문서의 테이블·함수·예약 작업 절을 그대로 SQL로 옮긴다.
  - 테이블, 인덱스, RLS(select to anon, authenticated), `revoke insert, update, delete`
  - 함수: Vault 비교(null 포함 거부, 42501), 배열·2000개 검증(22023), 항목 필터, `distinct on (id)`, `on conflict (id) do update`(published_at·source_id·collected_at 제외), 1년 삭제, `get diagnostics`
  - `revoke all ... from public; grant execute ... to anon, authenticated;`
  - `create extension if not exists pg_net with schema extensions;` `create extension if not exists pg_cron with schema pg_catalog;`
  - `select cron.schedule('collect-feeds', '5 */3 * * *', $job$ select net.http_post(...) $job$);`
- [ ] Step 2: `docs/feed-collection.md` 작성: 구조, 비밀값 생성(`openssl rand -hex 32`), Vault 등록(`vault.create_secret`), Vercel 환경 변수, 첫 수집 SQL, 결과 확인(`net._http_response`, `cron.job_run_details`, `feed_items` 개수), 주기 변경, 출처 단위 삭제, 되돌리기
- [ ] Step 3: README 테이블·함수 표와 문서 목록 갱신
- [ ] Step 4: lint·type-check·test·build 후 커밋 `chore: RSS 글 저장 테이블과 예약 수집 migration 추가 (#220)`

### Task 2 (#221): 수집 API

**Files:**
- Create: `src/services/feedCollector.ts`, `src/services/feedCollector.test.ts`
- Create: `src/app/api/feeds/collect/route.ts`, `src/app/api/feeds/collect/route.test.ts`
- Modify: `src/services/rssFeedService.ts` (수집 함수를 feedCollector에서 가져오도록, Task 3에서 제거)

**Interfaces:**
- Consumes: `upsert_feed_items` (Task 1)
- Produces:
  - `type FeedItemRow = { id: string; source_id: string; category: RSSFeedCategory; title: string; description: string; image_url: string | null; author: string | null; interests: InterestId[]; published_at: string }`
  - `collectFeedItems(now?: Date): Promise<{ items: FeedItemRow[]; failedSourceIds: string[]; okCount: number }>`
  - `toFeedItemRows(results: { source: FeedSource; feeds: Feed[] }[], now: Date): FeedItemRow[]` (순수 함수)
  - `collectCategoryFeeds(category, options?)` — Task 3 전까지 rssFeedService가 쓴다

- [ ] Step 1: `toFeedItemRows` 테스트 작성(RED): 발행 시각 파싱 실패 제외, 미래 시각을 `now`로 보정, 카테고리를 넘는 같은 id는 먼저 나온 것만, 빈 이미지 → null, ISO 문자열로 변환
- [ ] Step 2: 구현(GREEN). `fetchRSSFeed`와 정규화를 feedCollector로 옮기고 rssFeedService는 import로 바꾼다. 출처 결과를 `{ source, feeds, ok }`로 돌려준다.
- [ ] Step 3: 라우트 테스트(RED): env 없음 500, 헤더 없음·틀림 401, 정상 시 rpc 이름·인자(`p_secret`, `p_items`)와 응답, rpc 오류 500(문구 고정), 실패 출처 id 응답 포함. `collectFeedItems`는 `vi.mock`.
- [ ] Step 4: 라우트 구현(GREEN): `maxDuration = 60`, `timingSafeEqual`(길이 다르면 false), `createClient().rpc`.
- [ ] Step 5: 전체 검증 후 커밋 `feat: RSS 예약 수집 API 추가 (#221)`

### Task 3 (#222): 조회 전환과 커서

**Files:**
- Create: `src/utils/feedCursorUtils.ts`, `src/utils/feedCursorUtils.test.ts`
- Create: `src/services/feedItemService.ts`, `src/services/feedItemService.test.ts`
- Modify: `src/app/api/feeds/route.ts`, `src/app/api/feeds/route.test.ts`
- Modify: `src/hooks/useInfiniteFeed.tsx`, `src/utils/feedCacheUtils.ts`(+ test)
- Modify: `src/test/fakeSupabase.ts`(+ test), `docs/testing-guide.md`
- Delete: `src/services/rssFeedService.ts`, `src/services/rssFeedService.test.ts` (수집 테스트는 feedCollector로 옮긴다)
- Modify: `README.md`, `docs/content-sources-policy.md`

**Interfaces:**
- Consumes: `feed_items` (Task 1), `feedCollector` (Task 2)
- Produces:
  - `FEED_PERSONALIZE_WINDOW_DAYS: Record<RSSFeedCategory, number>` (`src/config/constants.ts`)
  - `type DateCursor = { v: 1; m: "d"; t: string; id: string }`
  - `type PersonalCursor = { v: 1; m: "p"; s: string; u: string; ph: 1 | 2; k?: { sc?: number; t: string; id: string } }`
  - `encodeFeedCursor(c): string`, `decodeFeedCursor(value: string): DateCursor | PersonalCursor` (TypeError)
  - `getFeedItemsPage(supabase, { category, limit, cursor?, interests, filterInterest?, query?, now }): Promise<{ feeds: Feed[]; nextCursor: string | null }>`
  - `type CursorFeedPage = { feeds: Feed[]; nextCursor: string | null }`, `type ScrapedFeedPage = { feeds; currentPage; totalCount; totalPages }`, `type FeedPage = CursorFeedPage | ScrapedFeedPage`

- [ ] Step 1: fakeSupabase에 `or`, `lt`, `lte`, `contains`, `ilike`, `limit` 추가(필터 기록만). 헬퍼 테스트와 testing-guide 갱신.
- [ ] Step 2: 커서 유틸 테스트(RED→GREEN): 왕복, base64 아님·JSON 아님·버전/모드/필드 타입/날짜 이상 거부.
- [ ] Step 3: 서비스 테스트(RED): 최신순 첫 페이지 필터(category, in source_id, order, limit+1), 다음 커서의 `or` 문자열, 칩 `contains`, 마지막 페이지 null, 맞춤 ①만으로 채움·①→② 경계·② 이어보기, 같은 시각 id 순서, 기간 s/u 고정(now가 달라도 커서 값 사용), 행→Feed 변환(출처 이름, null 이미지).
- [ ] Step 4: 서비스 구현(GREEN).
- [ ] Step 5: 라우트 테스트 갱신(RED→GREEN): RSS 카테고리 응답 형식, cursor 400, 스크랩 탭 기존 형식, is_scraped 표시.
- [ ] Step 6: `feedCacheUtils`(totalCount 없는 페이지)와 `useInfiniteFeed`(pageParam: 스크랩은 number, 그 외 string | null) 수정, 테스트.
- [ ] Step 7: rssFeedService 삭제, README·출처 정책 갱신, 전체 검증, 커밋 `feat: 피드 조회를 DB와 커서 방식으로 전환 (#222)`

### Task 4 (#223): 제목 검색

**Files:**
- Modify: `src/app/api/feeds/route.ts`(+ test), `src/services/feedItemService.ts`(+ test)
- Create: `src/components/feed/FeedSearchInput.tsx`, `src/components/feed/FeedSearchInput.test.tsx`
- Modify: `src/components/feed/CategoryByFeed.tsx`, `src/components/feed/FeedListState.tsx`, `src/hooks/useInfiniteFeed.tsx`, `README.md`

**Interfaces:**
- Consumes: `getFeedItemsPage` (Task 3)
- Produces: `query` 옵션 (`ilike('title', '%' + escapeLike(q) + '%')`), `FeedSearchInput({ value, onChange })`, `useInfiniteFeed({ query })`

- [ ] Step 1: 서비스·라우트 테스트(RED): q 2자 미만·50자 초과 400, ilike 패턴 이스케이프, 검색이면 최신순 모드.
- [ ] Step 2: 구현(GREEN).
- [ ] Step 3: 검색창 테스트(RED): 0.3초 뒤 onChange, 2글자 미만은 빈 값, 접근 가능한 이름.
- [ ] Step 4: 구현(GREEN), CategoryByFeed 연결(탭 전환 시 초기화), 빈 결과 문구.
- [ ] Step 5: 데스크톱·320px 확인, 전체 검증, 커밋 `feat: 피드 제목 검색 추가 (#223)`

### Task 5 (#224): 릴리스

- [ ] 버전 1.13.0 PR → 사용자 운영 작업 요청(migration, Vault, Vercel env) → 릴리스 PR → 배포 → 첫 수집 → Production 확인 → 태그·Release → 이슈·마일스톤 종료
