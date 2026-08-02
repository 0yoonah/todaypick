import type { QueryClient } from "@tanstack/react-query";
import type { DailyActivityType } from "@/services/dailyActivityService";
import type {
  DailyActivity,
  DailyActivityState,
} from "@/types/dailyActivity";

export const EMPTY_DAILY_ACTIVITY: DailyActivityState = {
  feed_clicked: false,
  quiz_completed: false,
  quote_viewed: false,
  reading_goal: 3,
  read_count: 0,
};

export const dailyActivityQueryKey = (userId: string, date: string) =>
  ["daily-activities", userId, date] as const;

export function getCompletedActivityCount(
  activity: DailyActivityState | null | undefined
): number {
  const state = activity ?? EMPTY_DAILY_ACTIVITY;
  return [
    state.feed_clicked,
    state.quiz_completed,
    state.quote_viewed,
  ].filter(Boolean).length;
}

export function markDailyActivityCompleted(
  queryClient: QueryClient,
  userId: string,
  date: string,
  activity: DailyActivityType
) {
  queryClient.setQueryData<DailyActivity | null>(
    dailyActivityQueryKey(userId, date),
    (current) => ({
      user_id: current?.user_id ?? userId,
      date: current?.date ?? date,
      feed_clicked: current?.feed_clicked ?? false,
      quiz_completed: current?.quiz_completed ?? false,
      quote_viewed: current?.quote_viewed ?? false,
      reading_goal: current?.reading_goal ?? 3,
      read_count: current?.read_count ?? 0,
      ...current,
      [activity]: true,
    })
  );
}
