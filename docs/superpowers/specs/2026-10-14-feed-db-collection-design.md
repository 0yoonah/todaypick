# RSS 예약 수집과 DB 저장 설계

- 작성일: 2026-10-14
- 대상 버전: v1.13.0

## 배경과 목표

지금은 사용자가 피드를 열 때 `/api/feeds`가 RSS 출처 30곳을 직접 가져오고 결과를 15분 동안 서버 캐시(`unstable_cache`)에 둔다.

- 캐시가 만료된 뒤 첫 요청은 모든 출처를 기다려야 해서 느리다. 출처 하나가 느리면 사용자도 기다린다.
- RSS는 최신 글 10~50개만 주므로, RSS에서 밀려난 글은 피드에서도 사라진다.
- 저장된 글이 없어 검색을 만들 수 없다.

목표는 다음과 같다.

1. 예약 작업이 3시간마다 RSS를 수집해 Supabase `feed_items`에 저장하고, 피드는 DB에서 읽는다.
2. 글은 발행 후 1년 동안 보관한다.
3. 새 글이 들어와도 "더보기"에서 중복·누락이 없도록 커서 방식으로 이어서 가져온다.
4. IT 뉴스·테크 블로그 탭에서 제목으로 검색할 수 있다.

## 확정한 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 저장 범위 | 지금 카드에 보이는 값 그대로 (제목, 요약 300자, 이미지 주소, 작성자, 출처, 발행일, 관심 분야) | 카드를 단순하게 만들지 않는다. 표시 범위는 넓히지 않는다 |
| 본문·이미지 파일 | 저장하지 않음 | 출처 정책 유지 |
| 보관 기간 | 발행 후 1년 | 검색 가치와 보관소 성격 사이의 절충 |
| 수집 주기 | 3시간 (`5 */3 * * *`, UTC) | GeekNews RSS 50개가 약 29시간 범위라 누락 없음. 출처 부담 1/3 |
| 예약 실행 | Supabase pg_cron + pg_net | GitHub Actions는 저장소가 60일 동안 조용하면 예약 실행을 끈다. Vercel Cron 무료 플랜은 하루 1회 |
| 쓰기 권한 | 비밀값을 확인하는 `security definer` 함수 하나 | 서비스 롤 키를 쓰지 않는다 (사용자 결정) |
| 회원 정렬 | 기간 안의 글만 관심 분야 우선, 기간 밖은 최신순. 테크 블로그 30일, IT 뉴스 3일 | 1년치가 쌓이면 오래된 관심 글이 오늘 글보다 앞서는 문제를 막는다 |
| 검색 | 제목만, `ILIKE` | 요약까지 검색하면 보관소 성격이 강해진다. 1만 건 이하라 인덱스 불필요 |
| 스크랩 탭 | 페이지 번호 방식 유지 | 이미 DB에서 읽고 있고 이번 범위와 무관 |

## 구조

```
pg_cron (5 */3 * * *)
  └─ pg_net: POST https://tdpick.vercel.app/api/feeds/collect
       Authorization: Bearer <Vault feed_collector_secret>
         └─ Vercel route: FEED_COLLECTOR_SECRET과 비교 → 다르면 401
              └─ feedCollector: 출처별 RSS 수집 (기존 rssSourceReader, 출처별 격리)
              └─ rpc upsert_feed_items(p_secret, p_items)
                   └─ Vault 비밀값과 다시 비교 → upsert → 1년 지난 글 삭제

브라우저 ─ GET /api/feeds?category&limit&cursor&interest&q
             └─ feedItemService: feed_items 조회 (활성 출처만), 정렬·커서 처리
```

### 데이터: `feed_items`

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `text` PK | 정규화한 원문 URL. 지금의 `Feed.id`와 같아 `scraped_feeds`·`feed_reads`의 `feed->>id`와 그대로 맞는다 |
| `source_id` | `text not null` | `src/data/feeds.ts`의 출처 id |
| `category` | `text not null` | `it_news` 또는 `tech_blog` (check 제약) |
| `title` | `text not null` | 최대 200자 |
| `description` | `text not null default ''` | 최대 300자 |
| `image_url` | `text` | 허용 호스트 이미지 주소. 없으면 null |
| `author` | `text` | 최대 100자 |
| `interests` | `text[] not null default '{}'` | 관심 분야 id |
| `published_at` | `timestamptz not null` | 발행 시각. 수집 시각보다 미래면 수집 시각으로 맞춘다 |
| `collected_at` | `timestamptz not null default now()` | 처음 수집한 시각 |
| `updated_at` | `timestamptz not null default now()` | 마지막으로 갱신한 시각 |

- 인덱스: `(category, published_at desc, id)`
- RLS: `anon`, `authenticated`에 select만 허용. insert·update·delete 권한은 회수한다.
- 출처 이름은 저장하지 않고 조회할 때 `feeds.ts`에서 찾는다. 출처 이름을 고치면 바로 반영된다.

### 쓰기 함수: `upsert_feed_items(p_secret text, p_items jsonb) returns jsonb`

- `security definer`, `search_path = ''`. `anon`, `authenticated`에 실행 권한을 준다. 비밀값이 권한의 전부다.
- `vault.decrypted_secrets`의 `feed_collector_secret`과 다르거나 둘 중 하나가 null이면 `42501`로 거부한다.
- `p_items`가 배열이 아니거나 2000개를 넘으면 `22023`으로 거부한다.
- 항목 검증: `id`가 `http://` 또는 `https://`로 시작, `category`가 두 값 중 하나, 제목·출처 id·발행 시각이 있음. 맞지 않는 항목은 건너뛴다. 길이는 SQL에서도 `left()`로 자른다.
- 같은 요청 안의 중복 id는 `distinct on (id)`로 하나만 쓴다.
- 충돌하면 제목·요약·이미지·작성자·관심 분야·`updated_at`만 갱신한다. `published_at`, `source_id`, `collected_at`은 처음 값을 유지한다. 발행 시각이 바뀌어 글이 위로 튀는 것을 막는다.
- 마지막에 `published_at < now() - interval '1 year'`인 글을 지운다.
- 반환: `{ "upserted": n, "deleted": m }`

### 예약 작업

- 확장: `pg_net`(schema `extensions`), `pg_cron`(schema `pg_catalog`).
- `cron.schedule('collect-feeds', '5 */3 * * *', ...)`로 등록한다. 같은 이름이면 덮어써서 다시 실행해도 안전하다.
- 호출: `net.http_post(url, headers, body '{}', timeout_milliseconds 60000)`. 헤더의 비밀값은 실행 시점에 Vault에서 읽는다.
- 비밀값은 migration에 넣지 않는다. 운영자가 Vault와 Vercel 환경 변수에 같은 값을 등록한다.

### 수집 API: `POST /api/feeds/collect`

- `maxDuration = 60`.
- `FEED_COLLECTOR_SECRET`이 없으면 500(`serverError`). `Authorization: Bearer <값>`이 다르면 401(`unauthorized`). 비교는 `timingSafeEqual`.
- 두 카테고리를 함께 수집한다. 출처당 8초·5MB 제한, 동시 5개, 전체 50초 예산.
- 수집 결과 변환
  - URL 정규화와 중복 제거는 지금 규칙(`utm_*`, hash 제거)을 따른다. 카테고리를 넘어 같은 URL이면 먼저 나온 것 하나만 쓴다.
  - 발행 시각을 읽을 수 없는 글은 버린다. 미래 시각은 수집 시각으로 맞춘다.
- `upsert_feed_items`를 부른다. 오류면 500. 원본 오류는 로그에만 남긴다.
- 응답: `{ upserted, deleted, sources: { ok: n, failed: [출처 id] } }`

### 조회 API: `GET /api/feeds`

- IT 뉴스·테크 블로그
  - 입력: `category`, `limit`(1~50, 기본 12), `cursor`(선택, 최대 500자), `interest`(선택), `q`(선택, 앞뒤 공백을 뺀 2~50자)
  - 응답: `{ feeds: Feed[], nextCursor: string | null }` (각 글에 `is_scraped` 포함)
  - `page`는 무시한다.
- 스크랩: 지금과 같다. `{ feeds, currentPage, totalCount, totalPages }`
- 잘못된 `cursor`, 짧거나 긴 `q`는 400(`badRequest`).
- 활성 출처(`getFeedSources(category)`)의 글만 보여 준다. 출처를 `enabled: false`로 바꾸면 바로 숨겨진다.

#### 정렬 모드

| 모드 | 조건 | 정렬 |
| --- | --- | --- |
| 최신순 | 비로그인, 관심 분야 없음, 칩 선택, 또는 검색 | `published_at desc, id asc` |
| 맞춤 | 관심 분야가 있는 회원이 칩도 검색도 쓰지 않을 때 | ① 기간 안: 관심 분야 일치 수 desc → `published_at desc` → `id asc`<br>② 기간 밖: `published_at desc, id asc` |

- 기간(`FEED_PERSONALIZE_WINDOW_DAYS`): 테크 블로그 30일, IT 뉴스 3일.
- 칩은 `interests @> [칩]`, 검색은 `title ilike %q%` (`%`, `_`, `\`는 이스케이프)로 거른다. 둘은 함께 쓸 수 있다.
- 맞춤 모드 ①은 기간 안의 글을 `id, published_at, interests`만 가져와 서버에서 정렬하고, 한 페이지에 필요한 글만 다시 전체 컬럼으로 읽는다. 기간 안 글은 많아야 수백 개다.
- ①을 다 보여 주면 같은 응답 안에서 ②로 이어 채운다.

#### 커서

- base64url로 인코딩한 JSON. 화면은 받은 값을 그대로 돌려보내기만 한다.
- 최신순: `{ v: 1, m: "d", t: 마지막 글 발행 시각, id: 마지막 글 id }`
  - 다음 페이지 조건: `published_at < t or (published_at = t and id > id)`
- 맞춤: `{ v: 1, m: "p", s: 기간 시작, u: 첫 요청 시각, ph: 1 | 2, k?: 마지막 글 키 }`
  - `s`, `u`는 첫 요청에서 정해 커서에 고정한다. 스크롤 중 기간 경계가 움직이거나 새 글이 들어와도 중복·누락이 없다. 첫 요청 뒤에 수집된 글은 이 스크롤에 나오지 않는다.
  - ①의 키는 `{ sc: 점수, t, id }`, ②의 키는 `{ t, id }`.
- 버전, 모드, 필드 타입, 날짜 형식이 맞지 않으면 `TypeError`로 400을 돌려준다.
- 마지막 페이지 판단: 필요한 개수보다 하나 더 읽어 남은 글이 있는지 확인한다.

### 화면

- `useInfiniteFeed`
  - IT 뉴스·테크 블로그: 첫 요청은 커서 없이, 다음 요청은 `nextCursor`를 보낸다. `nextCursor`가 null이면 끝이다.
  - 스크랩: 지금처럼 페이지 번호.
  - 검색어 `q`를 받아 요청과 쿼리 키에 넣는다.
- `updateFeedScrapCache`: `totalCount`가 있는 페이지만 개수를 고친다.
- 검색창
  - IT 뉴스·테크 블로그 탭의 관심 분야 칩 위에 둔다. 게시글 탭에는 없다.
  - 입력 후 0.3초 동안 멈추면 검색한다. 앞뒤 공백을 뺀 2글자 이상일 때만 검색하고, 그보다 짧으면 원래 목록을 보여 준다.
  - 결과가 없으면 "'검색어'와 맞는 글이 없어요"를 보여 준다. 로딩·오류는 지금 피드와 같다.
  - 탭을 바꾸면 검색어를 비운다.
  - 입력에는 `type="search"`와 접근 가능한 이름("피드 제목 검색")을 준다.

## 없애는 것

- `rssFeedService.ts`의 요청 시 수집과 `unstable_cache`. 수집 코드는 `feedCollector.ts`로 옮겨 수집 API가 쓴다.

## 배포와 운영

1. 이슈 PR을 모두 `develop`에 병합한다. 운영 DB는 건드리지 않는다.
2. 사용자 작업 (릴리스 PR 병합 전)
   - 운영 DB에 migration 적용
   - Vault에 `feed_collector_secret` 등록
   - Vercel 환경 변수 `FEED_COLLECTOR_SECRET` 등록 (Production, Preview)
3. 릴리스 PR을 병합하고 Production 배포를 확인한다.
4. 사용자가 첫 수집 SQL을 실행한다. 실행하지 않으면 다음 예약 시각까지 피드가 비어 있다.
5. 공개 API로 탭별 글 수, 정렬, 커서 이어 보기, 검색을 확인한다.

- migration 적용 후 릴리스 전까지는 예약 작업이 아직 없는 수집 주소를 불러 404가 난다. 해는 없다.
- 되돌리기: 릴리스 PR을 되돌리면 이전 코드(요청 시 수집)로 돌아간다. 테이블은 남겨도 이전 코드에 영향이 없다. 예약 작업은 `select cron.unschedule('collect-feeds')`로 끈다.
- 명령과 확인 방법은 `docs/feed-collection.md`에 둔다.

## 테스트

- 수집 API: 비밀값 없음·틀림 401, 환경 변수 없음 500, 정상 시 rpc 인자, 출처 하나 실패해도 나머지 저장, rpc 오류 500
- 수집 변환: URL 정규화와 중복 제거, 날짜 없는 글 제외, 미래 날짜 보정
- 커서: 인코딩·디코딩 왕복, 잘못된 값 거부
- 정렬: 맞춤 ①→② 경계, 페이지 사이 중복·누락 없음, 같은 발행 시각 순서, 기간 고정, 칩·검색은 최신순
- 조회 API: `cursor`·`q` 검증, 활성 출처 필터, 최신순 커서 조건, 스크랩 탭 유지
- 화면: 다음 요청의 커서 전달, 스크랩 캐시 갱신, 검색창(지연, 2글자 미만, 빈 결과, 탭 전환)
- `src/test/fakeSupabase.ts`에 `or`, `lt`, `lte`, `contains`, `ilike`, `limit`을 추가한다.
- SQL은 로컬에서 실행할 수 없다(Supabase CLI 없음). 리뷰로 확인하고 운영 적용 후 실제 동작으로 확인한다.

## 문서

- `README.md`: 주요 기능(검색, 예약 수집), 프로젝트 구조, 테이블·함수 표, 문서 목록
- `docs/content-sources-policy.md`: 저장 범위와 1년 보관, 출처 단위 삭제 절차
- `docs/feed-collection.md`(신규): 비밀값 등록, 첫 수집, 수집 결과 확인, 주기 변경, 되돌리기

## 범위 밖

- 과거 글 소급 수집 (RSS에 남은 글만)
- 인기 글, 요약 검색, 검색 인덱스
- 수집 결과 저장 테이블, 실패 알림
- Vercel 함수 리전 변경
