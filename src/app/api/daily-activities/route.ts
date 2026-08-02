import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSeoulDateKey, isValidDateKey } from "@/utils/dateUtils";
import {
  isDailyActivityType,
  recordDailyActivity,
} from "@/services/dailyActivityService";
import { parseInterestIds } from "@/config/interests";

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

    // 특정 날짜의 활동 조회
    const { data, error } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("date", date)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json(data || null, { status: 200 });
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

    await recordDailyActivity(supabase, user.user.id, date, activity);

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
