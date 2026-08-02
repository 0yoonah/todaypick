import type { DailyActivityType } from "@/services/dailyActivityService";

export interface DailyActivity {
  user_id: string;
  date: string;
  feed_clicked: boolean;
  quiz_completed: boolean;
  quote_viewed: boolean;
  reading_goal: number;
  read_count: number;
  reading_goal_completed: boolean;
  current_streak: number;
  longest_streak: number;
  created_at?: string;
  updated_at?: string;
}

export type DailyActivityState = Pick<
  DailyActivity,
  "feed_clicked" | "quiz_completed" | "quote_viewed"
> &
  Partial<
    Pick<
      DailyActivity,
      | "reading_goal"
      | "read_count"
      | "reading_goal_completed"
      | "current_streak"
      | "longest_streak"
    >
  >;

export interface DailyChecklistItem {
  activity: DailyActivityType;
  title: string;
  description: string;
  href: string;
}
