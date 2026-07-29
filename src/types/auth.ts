import { User } from "@supabase/supabase-js";
import type { InterestId } from "@/config/interests";

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
  weeklyReport: {
    current: WeeklyReportSummary;
    previous: WeeklyReportSummary;
    comparison: WeeklyReportComparison;
  };
}

export interface WeeklyReportSummary {
  startDate: string;
  endDate: string;
  learningDays: number;
  completedGoalDays: number;
  quizzesCompleted: number;
  correctQuizzes: number;
  accuracyRate: number;
  feedReads: number;
  feedsScraped: number;
  feedsEngaged: number;
  topInterest: InterestId | null;
}

export interface WeeklyReportComparison {
  learningDays: number;
  quizzesCompleted: number;
  feedsEngaged: number;
}
