import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function recordDailyActivity(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  activity: DailyActivityType
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
