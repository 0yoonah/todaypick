import type { DailyActivityType } from "@/services/dailyActivityService";

export interface DailyActivity {
  user_id: string;
  date: string;
  feed_clicked: boolean;
  quiz_completed: boolean;
  quote_viewed: boolean;
  reading_goal: number;
  read_count: number;
  created_at?: string;
  updated_at?: string;
}

export type DailyActivityState = Pick<
  DailyActivity,
  "feed_clicked" | "quiz_completed" | "quote_viewed"
> &
  Partial<Pick<DailyActivity, "reading_goal" | "read_count">>;

export interface DailyChecklistItem {
  activity: DailyActivityType;
  title: string;
  description: string;
  href: string;
}
