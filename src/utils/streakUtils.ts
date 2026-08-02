import { addDaysToDateKey } from "./dateUtils";

export interface DailyLearningActivity {
  date: string;
  reading_goal_completed?: boolean | null;
  feed_clicked?: boolean | null;
  quiz_completed?: boolean | null;
  quote_viewed?: boolean | null;
}

export function calculateLearningStreaks(
  activities: DailyLearningActivity[],
  today: string
) {
  const learnedDates = [
    ...new Set(
      activities
        .filter(({ reading_goal_completed }) => reading_goal_completed)
        .map(({ date }) => date)
    ),
  ].sort();

  let longestStreak = 0;
  let consecutiveDays = 0;
  let previousDate: string | undefined;

  for (const date of learnedDates) {
    consecutiveDays =
      previousDate && addDaysToDateKey(previousDate, 1) === date
        ? consecutiveDays + 1
        : 1;
    longestStreak = Math.max(longestStreak, consecutiveDays);
    previousDate = date;
  }

  const learnedDateSet = new Set(learnedDates);
  const yesterday = addDaysToDateKey(today, -1);
  let cursor = learnedDateSet.has(today)
    ? today
    : learnedDateSet.has(yesterday)
      ? yesterday
      : undefined;
  let currentStreak = 0;

  while (cursor && learnedDateSet.has(cursor)) {
    currentStreak++;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return { currentStreak, longestStreak };
}
