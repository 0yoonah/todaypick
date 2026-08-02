import type { InterestId } from "@/config/interests";
import type { DailyLearningActivity } from "@/utils/streakUtils";

export interface DatedQuizResult {
  answered_at: string;
  is_correct: boolean;
}

export interface DatedFeedActivity {
  feedId: string;
  date: string;
  interests: InterestId[];
  kind: "read" | "scraped";
}

type GoalAwareDailyActivity = DailyLearningActivity & {
  readingGoalCompleted?: boolean;
};

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

export function createWeeklyReport(
  dateKeys: string[],
  dailyActivities: GoalAwareDailyActivity[],
  quizResults: DatedQuizResult[],
  feedActivities: DatedFeedActivity[],
  toDateKey: (value: string) => string
): WeeklyReportSummary {
  const dateSet = new Set(dateKeys);
  const weekActivities = dailyActivities.filter(({ date }) =>
    dateSet.has(date)
  );
  const weekQuizzes = quizResults.filter(({ answered_at }) =>
    dateSet.has(toDateKey(answered_at))
  );
  const weekFeeds = feedActivities.filter(({ date }) => dateSet.has(date));
  const uniqueFeeds = new Set(weekFeeds.map(({ feedId }) => feedId));
  const interestCounts = new Map<InterestId, number>();

  for (const { interests } of weekFeeds) {
    for (const interest of interests) {
      interestCounts.set(interest, (interestCounts.get(interest) ?? 0) + 1);
    }
  }

  const topInterest =
    [...interestCounts.entries()].sort(
      ([interestA, countA], [interestB, countB]) =>
        countB - countA || interestA.localeCompare(interestB)
    )[0]?.[0] ?? null;
  const correctQuizzes = weekQuizzes.filter(({ is_correct }) => is_correct).length;

  return {
    startDate: dateKeys[0],
    endDate: dateKeys.at(-1) ?? dateKeys[0],
    learningDays: weekActivities.filter(
      ({ feed_clicked, quiz_completed, quote_viewed }) =>
        feed_clicked || quiz_completed || quote_viewed
    ).length,
    completedGoalDays: weekActivities.filter(
      ({ feed_clicked, quiz_completed, quote_viewed, readingGoalCompleted }) =>
        (readingGoalCompleted ?? feed_clicked) && quiz_completed && quote_viewed
    ).length,
    quizzesCompleted: weekQuizzes.length,
    correctQuizzes,
    accuracyRate:
      weekQuizzes.length > 0
        ? Math.round((correctQuizzes / weekQuizzes.length) * 100)
        : 0,
    feedReads: weekFeeds.filter(({ kind }) => kind === "read").length,
    feedsScraped: weekFeeds.filter(({ kind }) => kind === "scraped").length,
    feedsEngaged: uniqueFeeds.size,
    topInterest,
  };
}

export function compareWeeklyReports(
  current: WeeklyReportSummary,
  previous: WeeklyReportSummary
): WeeklyReportComparison {
  return {
    learningDays: current.learningDays - previous.learningDays,
    quizzesCompleted:
      current.quizzesCompleted - previous.quizzesCompleted,
    feedsEngaged: current.feedsEngaged - previous.feedsEngaged,
  };
}
