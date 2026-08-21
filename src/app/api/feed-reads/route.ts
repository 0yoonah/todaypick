import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseFeedReadPagination } from "@/utils/feedReadUtils";
import { syncReadingGoalCompletion } from "@/services/dailyActivityService";
import { addDaysToDateKey, getSeoulDateKey } from "@/utils/dateUtils";
import { badRequest, serverError, unauthorized } from "@/utils/apiResponse";

const HISTORY_DAYS = 30;
const HISTORY_MAX_ITEMS = 100;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const { page, limit } = parseFeedReadPagination(
      new URL(request.url).searchParams
    );
    const start = (page - 1) * limit;
    const cutoffDate = addDaysToDateKey(
      getSeoulDateKey(),
      -(HISTORY_DAYS - 1)
    );

    if (start >= HISTORY_MAX_ITEMS) {
      return NextResponse.json({
        reads: [],
        totalCount: HISTORY_MAX_ITEMS,
        totalPages: Math.ceil(HISTORY_MAX_ITEMS / limit),
        currentPage: page,
      });
    }

    const end = Math.min(start + limit - 1, HISTORY_MAX_ITEMS - 1);
    const { data, error, count } = await supabase
      .from("feed_reads")
      .select(
        "id, feed, read_date, first_read_at, last_read_at, read_count",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .gte("read_date", cutoffDate)
      .order("last_read_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    const totalCount = Math.min(count ?? 0, HISTORY_MAX_ITEMS);
    return NextResponse.json({
      reads: data ?? [],
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return badRequest(error.message);
    }
    console.error("읽은 글 히스토리 조회 오류:", error);
    return serverError("읽은 글 히스토리를 불러오지 못했습니다.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? [...new Set(body.ids.filter((id: unknown) => typeof id === "string"))]
      : [];
    if (ids.length === 0 || ids.length > 50) {
      return badRequest("삭제할 기록을 1개 이상 50개 이하로 선택해야 합니다.");
    }

    const { data: targets, error: targetError } = await supabase
      .from("feed_reads")
      .select("id, read_date")
      .in("id", ids)
      .eq("user_id", user.id);
    if (targetError) throw targetError;

    if (!targets || targets.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        updatedDates: [],
      });
    }

    const { error } = await supabase
      .from("feed_reads")
      .delete()
      .in(
        "id",
        targets.map((target) => target.id)
      )
      .eq("user_id", user.id);
    if (error) throw error;

    const updatedDates = await syncReadingGoalCompletion(
      supabase,
      user.id,
      targets.map((target) => target.read_date)
    );

    return NextResponse.json({
      success: true,
      deletedCount: targets.length,
      updatedDates,
    });
  } catch (error) {
    console.error("읽은 글 기록 삭제 오류:", error);
    return serverError("읽은 글 기록을 삭제하지 못했습니다.");
  }
}
