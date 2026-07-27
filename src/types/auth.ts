import { User } from "@supabase/supabase-js";

export interface LoginData {
  email: string;
  password: string;
}

export interface SignUpData extends LoginData {
  confirmPassword: string;
  nickname: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// 프로필 업데이트를 위한 타입 추가
export interface ProfileUpdateData {
  nickname: string;
  file?: File;
  removeAvatar?: boolean;
}

// 학습 통계를 위한 타입 추가
export interface LearningStatistics {
  totalQuizzes: number;
  correctQuizzes: number;
  accuracyRate: number;
  totalScrapedFeeds: number;
  totalScrapedQuotes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyStatistics: {
    date: string;
    quizzesCompleted: number;
    feedsScraped: number;
    quotesViewed: number;
    dailyProgress: {
      feedClick: boolean;
      quizComplete: boolean;
      quoteView: boolean;
    };
  }[];
}
