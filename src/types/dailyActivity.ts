import type { DailyActivityType } from "@/services/dailyActivityService";

export interface DailyActivity {
  user_id: string;
  date: string;
  feed_clicked: boolean;
  quiz_completed: boolean;
  quote_viewed: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DailyActivityState = Pick<
  DailyActivity,
  "feed_clicked" | "quiz_completed" | "quote_viewed"
>;

export interface DailyChecklistItem {
  activity: DailyActivityType;
  title: string;
  description: string;
  href: string;
}
