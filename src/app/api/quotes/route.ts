import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  unauthorized,
} from "@/utils/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = new URL(request.url).searchParams;
    const quoteId = searchParams.get("quoteId");

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return unauthorized();
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

      return NextResponse.json({ isScraped: !!data }, { status: 200 });
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
    return serverError("명언을 불러오는데 실패했습니다.", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return unauthorized();
    }

    const body = await request.json();
    const { quote } = body;

    if (!quote || !quote.id) {
      return badRequest("명언 정보가 필요합니다.");
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
      return conflict("이미 스크랩한 명언입니다.");
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
    return serverError("명언 스크랩에 실패했습니다.", error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return unauthorized();
    }

    const searchParams = new URL(request.url).searchParams;
    const quoteId = searchParams.get("quoteId");

    if (!quoteId) {
      return badRequest("quoteId가 필요합니다.");
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
      return notFound("스크랩한 명언을 찾을 수 없습니다.");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return serverError("명언 스크랩 해제에 실패했습니다.", error);
  }
}
