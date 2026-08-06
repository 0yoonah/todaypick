import type { SupabaseClient } from "@supabase/supabase-js";
import { countReadsByDate } from "@/utils/feedReadUtils";
import { isValidDateKey } from "@/utils/dateUtils";
import { resolveReadingGoal } from "@/utils/readingGoalUtils";

export const DAILY_ACTIVITY_TYPES = [
  "feed_clicked",
  "quiz_completed",
  "quote_viewed",
] as const;

export type DailyActivityType = (typeof DAILY_ACTIVITY_TYPES)[number];

export function isDailyActivityType(
  value: unknown
): value is DailyActivityType {
  return (
    typeof value === "string" &&
    DAILY_ACTIVITY_TYPES.includes(value as DailyActivityType)
  );
}

/**
 * 주어진 서울 날짜들의 읽기 수를 다시 집계해 일일 읽기 목표 완료 상태를 맞춘다.
 * 실제로 값이 바뀐 날짜만 갱신하고 그 목록을 반환한다.
 */
export async function syncReadingGoalCompletion(
  supabase: SupabaseClient,
  userId: string,
  dates: string[]
): Promise<string[]> {
  const targetDates = [...new Set(dates)].filter(isValidDateKey);
  if (targetDates.length === 0) {
    return [];
  }

  const [settingsResult, activitiesResult, readsResult] = await Promise.all([
    supabase
      .from("users")
      .select("daily_read_goal")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("daily_activities")
      .select("date, reading_goal, reading_goal_completed")
      .eq("user_id", userId)
      .in("date", targetDates),
    supabase
      .from("feed_reads")
      .select("read_date")
      .eq("user_id", userId)
      .in("read_date", targetDates),
  ]);

  const queryError =
    settingsResult.error || activitiesResult.error || readsResult.error;
  if (queryError) {
    throw queryError;
  }

  const readCounts = countReadsByDate(readsResult.data ?? []);
  const userGoal = settingsResult.data?.daily_read_goal;
  const staleActivities = (activitiesResult.data ?? []).filter((activity) => {
    const goal = resolveReadingGoal(activity.reading_goal, userGoal);
    const completed = (readCounts[activity.date] ?? 0) >= goal;
    return completed !== activity.reading_goal_completed;
  });

  const updatedAt = new Date().toISOString();
  for (const activity of staleActivities) {
    const goal = resolveReadingGoal(activity.reading_goal, userGoal);
    const { error } = await supabase
      .from("daily_activities")
      .update({
        reading_goal_completed: (readCounts[activity.date] ?? 0) >= goal,
        updated_at: updatedAt,
      })
      .eq("user_id", userId)
      .eq("date", activity.date);

    if (error) {
      throw error;
    }
  }

  return staleActivities.map((activity) => activity.date);
}

export async function recordDailyActivity(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  activity: DailyActivityType,
  readingGoal = 3
) {
  const updatedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("daily_activities")
    .update({ [activity]: true, updated_at: updatedAt })
    .eq("user_id", userId)
    .eq("date", date)
    .select("user_id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (updated) {
    return;
  }

  const { error: insertError } = await supabase.from("daily_activities").insert({
    user_id: userId,
    date,
    feed_clicked: activity === "feed_clicked",
    quiz_completed: activity === "quiz_completed",
    quote_viewed: activity === "quote_viewed",
    reading_goal: readingGoal,
    updated_at: updatedAt,
  });

  if (insertError?.code === "23505") {
    const { error: retryError } = await supabase
      .from("daily_activities")
      .update({ [activity]: true, updated_at: updatedAt })
      .eq("user_id", userId)
      .eq("date", date);

    if (retryError) {
      throw retryError;
    }
    return;
  }

  if (insertError) {
    throw insertError;
  }
}
