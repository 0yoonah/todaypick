// route
export const ROUTE_PATH = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  PROFILE: "/profile",
  FEEDS: "/feeds",
  WRITE: "/write",
  POSTS: "/posts",
} as const;

// 폼 데이터
export const FORM_DATA = {
  EMAIL: "email",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  NICKNAME: "nickname",
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
} as const;

export type ProfileTabType = (typeof PROFILE_TAB)[keyof typeof PROFILE_TAB];
