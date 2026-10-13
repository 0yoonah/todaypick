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
