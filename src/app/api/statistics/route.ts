import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { LearningStatistics } from "@/types/auth";

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
      .select("id, created_at")
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

    if (quizError || feedsError || quotesError || dailyError) {
      throw new Error("데이터 조회 중 오류가 발생했습니다.");
    }

    // 누적 통계 계산
    const totalQuizzes = quizResults?.length || 0;
    const correctQuizzes = quizResults?.filter((q) => q.is_correct).length || 0;
    const accuracyRate =
      totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
    const totalScrapedFeeds = scrapedFeeds?.length || 0;
    const totalScrapedQuotes = scrapedQuotes?.length || 0;

    // 연속 학습일 계산
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedActivities =
      dailyActivities?.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ) || [];

    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i];
      const hasLearned =
        activity.feed_clicked ||
        activity.quiz_completed ||
        activity.quote_viewed;

      if (hasLearned) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // 주간 통계 생성
    const getCurrentWeekDates = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
      }

      return weekDates;
    };

    const currentWeekDates = getCurrentWeekDates();
    const weeklyStatistics = [];

    for (const date of currentWeekDates) {
      const dateStr = date.toISOString().split("T")[0];

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
        quizResults?.filter((q) => q.answered_at.startsWith(dateStr)).length ||
        0;

      const dayFeedsScraped =
        scrapedFeeds?.filter((f) => f.created_at.startsWith(dateStr)).length ||
        0;

      const dayQuotesScraped =
        scrapedQuotes?.filter((q) => q.created_at.startsWith(dateStr)).length ||
        0;

      weeklyStatistics.push({
        date: dateStr,
        quizzesCompleted: dayQuizzes,
        feedsScraped: dayFeedsScraped,
        quotesViewed: dayQuotesScraped,
        dailyProgress,
      });
    }

    const statistics: LearningStatistics = {
      totalQuizzes,
      correctQuizzes,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      totalScrapedFeeds,
      totalScrapedQuotes,
      currentStreak,
      longestStreak,
      weeklyStatistics,
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
