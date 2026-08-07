import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSeoulDateKey, isValidDateKey } from "@/utils/dateUtils";
import {
  isDailyActivityType,
  recordDailyActivity,
} from "@/services/dailyActivityService";
import { parseInterestIds } from "@/config/interests";
import { isValidReadingGoal } from "@/utils/readingGoalUtils";
import { calculateLearningStreaks } from "@/utils/streakUtils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const date = searchParams.get("date");

    if (!date || !isValidDateKey(date)) {
      return NextResponse.json(
        { error: "날짜가 필요합니다." },
        { status: 400 }
      );
    }

    const [activityResult, userResult, readsResult, streakResult] = await Promise.all([
      supabase
        .from("daily_activities")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("date", date)
        .maybeSingle(),
      supabase
        .from("users")
        .select("daily_read_goal")
        .eq("id", user.user.id)
        .single(),
      supabase
        .from("feed_reads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.user.id)
        .eq("read_date", date),
      supabase
        .from("daily_activities")
        .select("date, reading_goal_completed")
        .eq("user_id", user.user.id),
    ]);

    if (activityResult.error || userResult.error || readsResult.error || streakResult.error) {
      throw activityResult.error || userResult.error || readsResult.error || streakResult.error;
    }

    const readingGoal =
      activityResult.data?.reading_goal ?? userResult.data.daily_read_goal;
    const readCount = readsResult.count ?? 0;
    const { currentStreak, longestStreak } = calculateLearningStreaks(
      streakResult.data ?? [],
      getSeoulDateKey()
    );

    return NextResponse.json(
      {
        user_id: user.user.id,
        date,
        feed_clicked: readCount >= readingGoal,
        quiz_completed: activityResult.data?.quiz_completed ?? false,
        quote_viewed: activityResult.data?.quote_viewed ?? false,
        cs_completed: activityResult.data?.cs_completed ?? false,
        reading_goal: readingGoal,
        read_count: readCount,
        reading_goal_completed:
          activityResult.data?.reading_goal_completed ?? readCount >= readingGoal,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        created_at: activityResult.data?.created_at,
        updated_at: activityResult.data?.updated_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("일일 활동 조회 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "일일 활동을 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { activity, feed } = body;
    const date = getSeoulDateKey();

    if (!isDailyActivityType(activity)) {
      return NextResponse.json(
        { error: "유효하지 않은 활동입니다." },
        { status: 400 }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from("users")
      .select("daily_read_goal")
      .eq("id", user.user.id)
      .single();
    if (settingsError) throw settingsError;

    await recordDailyActivity(
      supabase,
      user.user.id,
      date,
      activity,
      settings.daily_read_goal
    );

    if (
      activity === "feed_clicked" &&
      feed &&
      typeof feed.id === "string" &&
      typeof feed.title === "string" &&
      typeof feed.url === "string"
    ) {
      const { error: feedReadError } = await supabase.rpc("record_feed_read", {
        p_feed_id: feed.id,
        p_read_date: date,
        p_feed: {
          id: feed.id,
          title: feed.title,
            source: typeof feed.source === "string" ? feed.source : "",
            url: feed.url,
            category: typeof feed.category === "string" ? feed.category : "",
            published_at:
              typeof feed.published_at === "string" ? feed.published_at : "",
            interests: parseInterestIds(feed.interests),
        },
      });

      if (feedReadError) {
        console.error("피드 읽기 기록 저장 실패:", feedReadError);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("일일 활동 업데이트 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "일일 활동 업데이트에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const readingGoal = body?.readingGoal;
    if (!isValidReadingGoal(readingGoal)) {
      return NextResponse.json(
        { error: "읽기 목표는 1개 이상 20개 이하로 설정해야 합니다." },
        { status: 400 }
      );
    }

    const date = getSeoulDateKey();
    const { error: userError } = await supabase
      .from("users")
      .update({ daily_read_goal: readingGoal })
      .eq("id", user.user.id);
    if (userError) throw userError;

    const { data: updated, error: updateError } = await supabase
      .from("daily_activities")
      .update({ reading_goal: readingGoal })
      .eq("user_id", user.user.id)
      .eq("date", date)
      .select("user_id")
      .maybeSingle();
    if (updateError) throw updateError;

    if (!updated) {
      const { error: insertError } = await supabase
        .from("daily_activities")
        .insert({ user_id: user.user.id, date, reading_goal: readingGoal });

      if (insertError?.code === "23505") {
        const { error: retryError } = await supabase
          .from("daily_activities")
          .update({ reading_goal: readingGoal })
          .eq("user_id", user.user.id)
          .eq("date", date);
        if (retryError) throw retryError;
      } else if (insertError) {
        throw insertError;
      }
    }

    const { count: readCount, error: countError } = await supabase
      .from("feed_reads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.user.id)
      .eq("read_date", date);
    if (countError) throw countError;

    const { error: completionError } = await supabase
      .from("daily_activities")
      .update({ reading_goal_completed: (readCount ?? 0) >= readingGoal })
      .eq("user_id", user.user.id)
      .eq("date", date);
    if (completionError) throw completionError;

    return NextResponse.json({ readingGoal, date }, { status: 200 });
  } catch (error) {
    console.error("읽기 목표 변경 오류:", error);
    return NextResponse.json(
      { error: "읽기 목표를 변경하지 못했습니다." },
      { status: 500 }
    );
  }
}
