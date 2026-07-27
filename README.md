# TodayPick

> 하루 10분, IT 전문가로 성장하는 습관

TodayPick은 매일 IT 뉴스, 퀴즈, 명언을 제공하여 개발자들이 꾸준히 학습할 수 있도록 돕는 웹 애플리케이션입니다.

## 🚀 주요 기능

### 오늘의 피드

- **IT 뉴스**: 최신 IT 뉴스와 기술 트렌드
- **테크 블로그**: 개발자들이 주목하는 기술 블로그 글
- **RSS 피드 수집**: 다양한 소스에서 자동으로 최신 콘텐츠 수집
- **스크랩 기능**: 관심 있는 글을 저장하고 나중에 다시 볼 수 있음

### 오늘의 IT 퀴즈

- **매일 새로운 퀴즈**: 프로그래밍, 데이터베이스, 네트워크, 보안 등 다양한 카테고리
- **즉시 피드백**: 답안 제출 후 정답과 해설 확인
- **학습 통계**: 정답률과 연속 학습 기록 추적

### 오늘의 명언

- **영감을 주는 명언**: 개발자와 IT 전문가들의 명언
- **스크랩 기능**: 마음에 드는 명언 저장
- **클립보드 복사**: 명언을 쉽게 공유

### 사용자 프로필

- **학습 통계**: 퀴즈 정답률, 스크랩한 피드/명언 수
- **연속 학습 기록**: 현재 연속 학습일과 최장 연속 학습일
- **주간 학습 진행도**: 일주일 단위 학습 현황 시각화
- **개인화된 대시보드**: 스크랩한 콘텐츠와 퀴즈 기록 관리

## 🛠 기술 스택

### Frontend

- **Next.js 16.2.12** - React 기반 풀스택 프레임워크
- **React 19.2.8** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS 4** - 유틸리티 우선 CSS 프레임워크

### Backend & Database

- **Supabase**
  - PostgreSQL 데이터베이스
  - 실시간 구독
  - 인증 및 권한 관리
  - Row Level Security (RLS)

### 상태 관리 & 데이터 페칭

- **Zustand** - 가벼운 상태 관리 라이브러리
- **TanStack Query** - 서버 상태 관리 및 캐싱

### 기타 라이브러리

- **RSS Parser** - RSS 피드 파싱
- **React Icons** - 아이콘 라이브러리

## 📁 프로젝트 구조

```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── auth/          # 인증 관련 API
│   │   ├── feeds/         # 피드 관련 API
│   │   ├── quizzes/       # 퀴즈 관련 API
│   │   ├── quotes/        # 명언 관련 API
│   │   └── profile/       # 프로필 관련 API
│   ├── auth/              # 인증 페이지
│   ├── feeds/             # 피드 페이지
│   ├── profile/           # 프로필 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── feed/              # 피드 관련 컴포넌트
│   ├── profile/           # 프로필 관련 컴포넌트
│   ├── quote/             # 명언 관련 컴포넌트
│   └── ui/                # 기본 UI 컴포넌트
├── hooks/                 # 커스텀 훅
├── services/              # 비즈니스 로직
├── stores/                # 상태 관리
├── types/                 # TypeScript 타입 정의
├── utils/                 # 유틸리티 함수
└── data/                  # 정적 데이터
```

## 🚀 시작하기

```bash
# 저장소 클론 및 의존성 설치
git clone <repository-url>
cd todaypick
nvm use
npm install

# 환경 변수 설정 (.env.local 파일 생성)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 개발 서버 실행
npm run dev
```

## 🗄 데이터베이스 스키마

### 주요 테이블

- **users** - 사용자 정보
- **scraped_feeds** - 스크랩한 피드
- **scraped_quotes** - 스크랩한 명언
- **quiz_results** - 퀴즈 답안 기록
- **daily_activities** - 일일 학습 활동 기록

## 🔧 개발 스크립트

```bash
# 개발 서버 실행 (Next.js 16은 Turbopack을 기본 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린팅
npm run lint
```

## 📱 주요 페이지

- **홈페이지** (`/`) - 오늘의 피드, 퀴즈, 명언
- **피드 페이지** (`/feeds`) - 전체 피드 목록 및 카테고리별 필터링
- **프로필 페이지** (`/profile`) - 사용자 정보 및 학습 통계
- **로그인** (`/login`) - 사용자 인증
- **회원가입** (`/signup`) - 새 계정 생성

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **스켈레톤 로딩**: 부드러운 로딩 경험
- **무한 스크롤**: 효율적인 콘텐츠 로딩
- **접근성**: 키보드 내비게이션 및 스크린 리더 지원

## 🔐 인증 및 보안

- **Supabase Auth**: 이메일/비밀번호 기반 인증
- **Row Level Security**: 데이터베이스 레벨 보안
- **미들웨어**: 인증 상태 확인 및 리다이렉션
- **세션 관리**: 안전한 사용자 세션 처리
