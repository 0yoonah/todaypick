# TodayPick

> 하루 10분, IT 전문가로 성장하는 습관

TodayPick은 매일 IT 콘텐츠를 읽고 기록하며 학습 습관을 만드는 웹 애플리케이션입니다. 읽은 글을 다시 찾고, 하루 읽기 목표와 연속 학습일을 관리하고, 읽은 글을 인용해 글을 쓰고 공유할 수 있습니다.

## 🚀 주요 기능

### 오늘의 피드

- **IT 기사·테크 블로그**: 여러 소스의 RSS를 모아 최신 콘텐츠를 제공
- **관심 분야 필터**: 프론트엔드, 백엔드, AI·데이터, 인프라·DevOps, 보안, 커리어
- **스크랩**: 관심 있는 글을 저장하고 프로필에서 다시 확인
- **무한 스크롤**: 중복 제거와 결정적 정렬을 마친 뒤 12개씩 페이지 로딩

### 읽기 기록과 목표

- **읽은 글 히스토리**: 원문을 연 기록을 서울 날짜 기준으로 저장, 최근 30일·최대 100개 보관
- **재방문 정보**: 최초 읽기, 최근 읽기, 재방문 횟수 구분
- **하루 읽기 목표**: 1~20개 범위로 설정하고 오늘 진행률 확인
- **연속 학습일**: 서울 날짜 기준 목표 달성일로 현재·최고 스트릭 계산
- **기록 삭제**: 기록을 지우면 해당 날짜의 목표 달성 상태와 스트릭을 다시 계산

### 인용 기반 글쓰기

- **글 작성**: Markdown 본문, 관심 분야 태그, 썸네일, 공개·비공개 상태
- **원문 인용**: 피드나 읽은 글에서 바로 인용해 초안 시작
- **공개 게시글**: 비로그인 사용자도 열람 가능, 게시글 탭에서 12개씩 무한 스크롤
- **북마크**: 다른 사용자의 공개 게시글을 저장해 프로필에서 확인

### 오늘의 IT 퀴즈

- **매일 한 문제**: 서울 날짜 기준으로 결정적으로 선정
- **이미 푼 문제 제외**: 아직 풀지 않은 문제를 우선 제시하고, 모두 풀면 완주 상태 안내
- **즉시 피드백**: 정답과 해설을 바로 확인

### CS 지식

- **분야별 문항 80개**: 네트워크, 운영체제, 데이터베이스, 자료구조·알고리즘, 프론트엔드, 백엔드, 시스템 설계
- **직접 답변과 채점**: 답을 직접 쓰면 키워드 언급 여부로 참고 점수를 계산하고 모범 답안을 제공
- **힌트**: 언급하면 좋은 키워드 목록 확인
- **복습 목록**: 60점 미만으로 채점된 문항을 프로필 `CS 복습` 탭에서 다시 풀기
- **용어 연결**: 채점 결과의 키워드 중 용어사전에 있는 항목은 정의로 바로 이동

### IT 용어사전

- **용어 121개**: CS 지식과 같은 분야 분류를 사용
- **검색**: 표제어와 영문 별칭으로 검색, 검색어는 URL에 유지
- **상세 화면**: 사전적 설명과 함께 관련 CS 지식 문항, 관련 용어로 연결

### 오늘의 명언

- **개발자 명언**: 매일 새로운 명언 제공
- **스크랩과 복사**: 마음에 드는 명언 저장, 클립보드 복사

### 프로필과 학습 통계

- **저장한 콘텐츠**: RSS 스크랩과 게시글 북마크를 한곳에서 조회
- **읽은 글·내가 쓴 글·퀴즈 기록·CS 복습·스크랩한 명언** 탭 제공
- **주간 리포트**: 이번 주와 지난주의 학습일, 읽기량, 퀴즈 정답률 비교
- **학습 통계**: 누적 퀴즈 수, 정답률, 현재·최고 스트릭

## 🛠 기술 스택

### Frontend

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### Backend & Database

- **Supabase** — PostgreSQL, 인증, Storage, Row Level Security

### 상태 관리 & 데이터 페칭

- **TanStack Query** — 서버 상태, 캐시, 무한 스크롤
- **Zustand** — 인증 상태

### 기타

- **rss-parser** — RSS 수집
- **react-markdown / remark-gfm** — 게시글 본문 렌더링
- **react-icons**
- **Vitest** — 단위 테스트 (node·jsdom 두 프로젝트로 분리)
- **Testing Library** — 컴포넌트 테스트

## 📁 프로젝트 구조

```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── cs-reviews/        # CS 지식 채점 기록, 복습 목록
│   │   ├── daily-activities/  # 일일 활동, 읽기 목표
│   │   ├── feed-reads/        # 읽은 글 히스토리
│   │   ├── feeds/             # RSS 피드, 스크랩
│   │   ├── profile/           # 프로필, 관심 분야
│   │   ├── quizzes/           # 오늘의 퀴즈, 답안
│   │   ├── quotes/            # 명언
│   │   ├── statistics/        # 학습 통계, 주간 리포트
│   │   ├── writing-bookmarks/ # 게시글 북마크
│   │   └── writing-drafts/    # 글 작성, 공개 게시글
│   ├── cs/                # CS 지식
│   ├── feeds/             # 피드 페이지
│   ├── glossary/          # IT 용어사전 (목록·검색, [id] 상세)
│   ├── login/             # 로그인
│   ├── posts/[id]/        # 게시글 상세
│   ├── profile/           # 프로필
│   ├── signup/            # 회원가입
│   └── write/             # 글쓰기
├── components/            # 화면 컴포넌트
│   ├── auth/  cs/  feed/  glossary/  profile/  quote/  write/  ui/
├── config/                # 상수, 관심 분야, RSS 소스 설정
├── data/                  # 정적 데이터 (퀴즈, 명언, CS 문항, IT 용어, 피드 소스)
├── hooks/                 # 커스텀 훅
├── services/              # 서버 로직 (RSS 수집, 일일 활동 등)
├── stores/                # Zustand 스토어
├── test/                  # 테스트 공용 헬퍼 (Supabase fake, 요청·렌더 헬퍼)
├── types/                 # 타입 정의
└── utils/                 # 유틸리티 (날짜, 통계, 피드, 글쓰기, API 응답 등)
```

## 🚀 시작하기

```bash
# 저장소 클론 및 의존성 설치
git clone <repository-url>
cd todaypick
nvm use          # .nvmrc 기준 Node.js 24
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

필요한 환경 변수는 `.env.example`의 두 개입니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## 🗄 데이터베이스 스키마

Supabase CLI로 로컬 프로젝트를 연결한 뒤 마이그레이션을 적용합니다.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list --linked   # 로컬과 원격의 적용 상태 비교
npx supabase db push          # 미적용 migration 반영
```

`supabase/migrations`는 테이블, 인덱스, 트리거, RLS 정책과 Storage 정책의 기준 소스입니다.
Dashboard에서 직접 스키마를 변경했다면 `npx supabase db diff -f <migration-name>`으로 변경 이력을 먼저 저장합니다.

원격 적용 확인과 릴리스 절차는 [docs/release-operations.md](docs/release-operations.md)를 따릅니다.

### 주요 테이블

| 테이블 | 용도 |
| --- | --- |
| `users` | 사용자 프로필, 관심 분야, 하루 읽기 목표 |
| `daily_activities` | 날짜별 학습 활동과 읽기 목표 달성 상태 |
| `feed_reads` | 읽은 글 히스토리(서울 날짜 기준, 재방문 횟수 포함) |
| `scraped_feeds` | 스크랩한 RSS 피드 |
| `scraped_quotes` | 스크랩한 명언 |
| `quiz_results` | 퀴즈 답안과 정답 여부 |
| `cs_reviews` | CS 지식 채점 기록(점수, 언급한 키워드, 답변) |
| `writing_drafts` | 작성한 글(공개·비공개) |
| `writing_bookmarks` | 북마크한 공개 게시글 |

### 주요 함수

| 함수 | 용도 |
| --- | --- |
| `record_feed_read` | 읽은 글 기록과 일일 목표 달성 상태 갱신 |
| `cleanup_feed_read_history` | 30일·100개 보관 정책에 따른 기록 정리 (`pg_cron`) |
| `get_public_writing_drafts` | 공개 게시글 조회 |
| `handle_new_user` | 가입 시 프로필 생성 |

## 🔧 개발 스크립트

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Vitest 단위 테스트
```

코드 변경 후에는 위 네 가지 검증(`lint`, `type-check`, `test`, `build`)을 모두 실행합니다.
GitHub Actions `CI / verify`가 같은 명령을 실행합니다.

## 📱 주요 페이지

| 경로 | 설명 |
| --- | --- |
| `/` | 오늘 읽어볼 콘텐츠, 오늘의 퀴즈, 오늘의 명언, 학습 체크리스트 |
| `/cs` | CS 지식 문항과 분야 필터 |
| `/glossary` | IT 용어사전 목록과 검색 |
| `/glossary/[id]` | 용어 상세 |
| `/feeds` | IT 기사·테크 블로그·게시글 탭과 관심 분야 필터 |
| `/posts/[id]` | 공개 게시글 상세 |
| `/write` | 글쓰기와 수정 |
| `/profile` | 저장한 콘텐츠, 읽은 글, 내가 쓴 글, 퀴즈 기록, CS 복습, 명언, 학습 통계 |
| `/login`, `/signup` | 인증 |

## 🎨 UI/UX 기준

- **반응형**: 320px 모바일부터 데스크톱까지 지원
- **콘텐츠 폭**: 주요 페이지는 `max-width: 1080px`과 동일한 좌우 시작선
- **색상 토큰**: `src/app/globals.css`의 역할 기반 토큰 사용
- **상태 구분**: 로딩·오류·빈 데이터·비로그인 상태를 서로 구분해 표시
- **접근성**: 키보드 내비게이션, accessible name, `prefers-reduced-motion` 존중

## 🔐 인증 및 보안

- **Supabase Auth**: 이메일/비밀번호 인증
- **Row Level Security**: 사용자 데이터는 본인만 접근, 공개 게시글은 제한된 함수로 조회
- **미들웨어**: 인증 상태 확인과 리다이렉션
- **RSS 수집**: 허용 목록 기반 수집, 원문 본문과 HTML은 저장하지 않음

## 📚 문서

- [AGENTS.md](AGENTS.md) — 브랜치, 커밋, PR, 릴리스 규칙
- [docs/release-operations.md](docs/release-operations.md) — migration 적용 확인과 릴리스·검증 절차
- [docs/content-data-policy.md](docs/content-data-policy.md) — 콘텐츠를 코드와 DB 중 어디에 둘지 판단하는 기준
- [docs/testing-guide.md](docs/testing-guide.md) — API route와 컴포넌트 테스트에 쓰는 헬퍼와 작성 기준
- [docs/rss-validation-v1.5.0.md](docs/rss-validation-v1.5.0.md) — RSS 수집 검증 기록
