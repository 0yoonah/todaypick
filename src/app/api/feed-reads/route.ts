import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseFeedReadPagination } from "@/utils/feedReadUtils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { page, limit } = parseFeedReadPagination(
      new URL(request.url).searchParams
    );
    const start = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from("feed_reads")
      .select(
        "id, feed, read_date, first_read_at, last_read_at, read_count",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("last_read_at", { ascending: false })
      .range(start, start + limit - 1);

    if (error) throw error;

    const totalCount = count ?? 0;
    return NextResponse.json({
      reads: data ?? [],
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("읽은 글 히스토리 조회 오류:", error);
    return NextResponse.json(
      { error: "읽은 글 히스토리를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "기록 ID가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabase
      .from("feed_reads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("읽은 글 기록 삭제 오류:", error);
    return NextResponse.json(
      { error: "읽은 글 기록을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
