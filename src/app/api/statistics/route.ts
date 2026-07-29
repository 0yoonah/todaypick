import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { LearningStatistics } from "@/types/auth";
import {
  getCurrentWeekDateKeys,
  getSeoulDateKey,
  getWeekDateKeys,
} from "@/utils/dateUtils";
import { calculateLearningStreaks } from "@/utils/streakUtils";
import { parseInterestIds } from "@/config/interests";
import {
  compareWeeklyReports,
  createWeeklyReport,
  type DatedFeedActivity,
} from "@/utils/weeklyReportUtils";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = user.user.id;

    // 기존 테이블들에서 데이터 조회
    const { data: quizResults, error: quizError } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("user_id", userId);

    const { data: scrapedFeeds, error: feedsError } = await supabase
      .from("scraped_feeds")
      .select("id, feed, created_at")
      .eq("user_id", userId);

    const { data: scrapedQuotes, error: quotesError } = await supabase
      .from("scraped_quotes")
      .select("id, created_at")
      .eq("user_id", userId);

    const { data: dailyActivities, error: dailyError } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    const { data: feedReads, error: feedReadsError } = await supabase
      .from("feed_reads")
      .select("feed_id, feed, read_date, read_at")
      .eq("user_id", userId);

    if (quizError || feedsError || quotesError || dailyError || feedReadsError) {
      throw new Error("데이터 조회 중 오류가 발생했습니다.");
    }

    // 누적 통계 계산
    const totalQuizzes = quizResults?.length || 0;
    const correctQuizzes = quizResults?.filter((q) => q.is_correct).length || 0;
    const accuracyRate =
      totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
    const totalScrapedFeeds = scrapedFeeds?.length || 0;
    const totalScrapedQuotes = scrapedQuotes?.length || 0;

    const { currentStreak, longestStreak } = calculateLearningStreaks(
      dailyActivities || [],
      getSeoulDateKey()
    );

    const currentWeekDates = getCurrentWeekDateKeys();
    const previousWeekDates = getWeekDateKeys(new Date(), -1);
    const weeklyStatistics = [];

    for (const dateStr of currentWeekDates) {
      // 해당 날짜의 일일 활동 찾기
      const dayActivity = dailyActivities?.find(
        (activity) => activity.date === dateStr
      );

      const dailyProgress = {
        feedClick: dayActivity?.feed_clicked || false,
        quizComplete: dayActivity?.quiz_completed || false,
        quoteView: dayActivity?.quote_viewed || false,
      };

      // 기존 데이터에서 해당 날짜의 수치들 계산
      const dayQuizzes =
        quizResults?.filter(
          (q) => getSeoulDateKey(new Date(q.answered_at)) === dateStr
        ).length ||
        0;

      const dayFeedsScraped =
        scrapedFeeds?.filter(
          (f) => getSeoulDateKey(new Date(f.created_at)) === dateStr
        ).length ||
        0;

      const dayQuotesScraped =
        scrapedQuotes?.filter(
          (q) => getSeoulDateKey(new Date(q.created_at)) === dateStr
        ).length ||
        0;

      weeklyStatistics.push({
        date: dateStr,
        quizzesCompleted: dayQuizzes,
        feedsScraped: dayFeedsScraped,
        quotesViewed: dayQuotesScraped,
        dailyProgress,
      });
    }

    const feedActivities: DatedFeedActivity[] = [
      ...(feedReads ?? []).map((read) => ({
        feedId: read.feed_id,
        date: read.read_date,
        interests: parseInterestIds(read.feed?.interests),
        kind: "read" as const,
      })),
      ...(scrapedFeeds ?? []).map((scrap) => ({
        feedId: String(scrap.feed?.id ?? scrap.id),
        date: getSeoulDateKey(new Date(scrap.created_at)),
        interests: parseInterestIds(scrap.feed?.interests),
        kind: "scraped" as const,
      })),
    ];
    const toDateKey = (value: string) => getSeoulDateKey(new Date(value));
    const currentReport = createWeeklyReport(
      currentWeekDates,
      dailyActivities || [],
      quizResults || [],
      feedActivities,
      toDateKey
    );
    const previousReport = createWeeklyReport(
      previousWeekDates,
      dailyActivities || [],
      quizResults || [],
      feedActivities,
      toDateKey
    );

    const statistics: LearningStatistics = {
      totalQuizzes,
      correctQuizzes,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      totalScrapedFeeds,
      totalScrapedQuotes,
      currentStreak,
      longestStreak,
      weeklyStatistics,
      weeklyReport: {
        current: currentReport,
        previous: previousReport,
        comparison: compareWeeklyReports(currentReport, previousReport),
      },
    };

    return NextResponse.json(statistics, { status: 200 });
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "통계를 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
