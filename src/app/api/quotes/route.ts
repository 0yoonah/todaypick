import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = new URL(request.url).searchParams;
    const quoteId = searchParams.get("quoteId");

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // quoteId가 있으면 오늘의 명언 스크랩 상태 확인
    if (quoteId) {
      const { data, error } = await supabase
        .from("scraped_quotes")
        .select("id")
        .eq("user_id", user.user.id)
        .eq("quote->>id", quoteId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return NextResponse.json(!!data, { status: 200 });
    }

    // quoteId가 없으면 모든 스크랩된 명언 조회
    const { data, error } = await supabase
      .from("scraped_quotes")
      .select("*")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "명언을 불러오는데 실패했습니다.",
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
    const { quote } = body;

    if (!quote || !quote.id) {
      return NextResponse.json(
        { error: "명언 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: existingScrap, error: checkError } = await supabase
      .from("scraped_quotes")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("quote->>id", quote.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingScrap) {
      return NextResponse.json(
        { error: "이미 스크랩한 명언입니다." },
        { status: 409 }
      );
    }

    // 명언 스크랩
    const { data, error } = await supabase
      .from("scraped_quotes")
      .insert({
        user_id: user.user.id,
        quote: quote,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("명언 스크랩 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "명언 스크랩에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const quoteId = searchParams.get("quoteId");

    if (!quoteId) {
      return NextResponse.json(
        { error: "quoteId가 필요합니다." },
        { status: 400 }
      );
    }

    // 명언 스크랩 해제
    const { data, error } = await supabase
      .from("scraped_quotes")
      .delete()
      .eq("user_id", user.user.id)
      .eq("quote->>id", quoteId)
      .select("id");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "스크랩한 명언을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("명언 스크랩 해제 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "명언 스크랩 해제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
