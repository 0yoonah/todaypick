import { NextRequest, NextResponse } from "next/server";
import { parseInterestIds } from "@/config/interests";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const interests = parseInterestIds(body.interests);

    if (
      !Array.isArray(body.interests) ||
      interests.length !== new Set(body.interests).size
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 관심 분야가 포함되어 있습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("users")
      .update({ interests })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ interests }, { status: 200 });
  } catch (error) {
    console.error("관심 분야 저장 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "관심 분야를 저장하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
