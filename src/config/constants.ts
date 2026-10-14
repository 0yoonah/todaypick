// route
export const ROUTE_PATH = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  PROFILE: "/profile",
  FEEDS: "/feeds",
  WRITE: "/write",
  POSTS: "/posts",
  CS: "/cs",
  GLOSSARY: "/glossary",
  SOURCES: "/sources",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

// 콘텐츠 삭제 요청과 개인정보 문의를 받는 운영자 연락처
export const CONTACT_EMAIL = "dhdbsdk33@gmail.com";

// 폼 데이터
export const FORM_DATA = {
  EMAIL: "email",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  NICKNAME: "nickname",
  AGE_CONFIRMED: "ageConfirmed",
  TERMS_AGREED: "termsAgreed",
} as const;

// Feed 카테고리
export const FEED_CATEGORY = {
  IT_NEWS: "it_news",
  TECH_BLOG: "tech_blog",
  SCRAPED: "scraped",
} as const;

// 피드 화면 한 페이지의 카드 수. 서버에서 미리 그리는 첫 페이지와 브라우저 요청이 같은 값을 쓴다.
export const FEED_PAGE_SIZE = 12;

// 회원 맞춤 정렬에서 관심 분야를 우선하는 기간(일). 이보다 오래된 글은 최신순으로 이어진다.
// 뉴스는 빨리 낡고 기술 글은 오래 읽혀 탭마다 다르게 둔다.
export const FEED_PERSONALIZE_WINDOW_DAYS = {
  it_news: 3,
  tech_blog: 30,
} as const;

// 프로필 탭
export const PROFILE_TAB = {
  SCRAPED_FEEDS: "scraped_feeds",
  READING_HISTORY: "reading_history",
  QUIZ_RECORDS: "quiz_records",
  SCRAPED_QUOTES: "scraped_quotes",
  LEARNING_STATISTICS: "learning_statistics",
  WRITING: "writing",
  CS_REVIEW: "cs_review",
} as const;

export type ProfileTabType = (typeof PROFILE_TAB)[keyof typeof PROFILE_TAB];

export const isProfileTab = (value: unknown): value is ProfileTabType =>
  typeof value === "string" &&
  (Object.values(PROFILE_TAB) as string[]).includes(value);
