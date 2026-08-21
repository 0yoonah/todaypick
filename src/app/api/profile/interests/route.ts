import { NextRequest, NextResponse } from "next/server";
import { parseInterestIds } from "@/config/interests";
import { createClient } from "@/utils/supabase/server";
import { badRequest, serverError, unauthorized } from "@/utils/apiResponse";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const body = await request.json();
    const interests = parseInterestIds(body.interests);

    if (
      !Array.isArray(body.interests) ||
      interests.length !== new Set(body.interests).size
    ) {
      return badRequest("유효하지 않은 관심 분야가 포함되어 있습니다.");
    }

    const { error } = await supabase
      .from("users")
      .update({ interests })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ interests }, { status: 200 });
  } catch (error) {
    return serverError("관심 분야를 저장하지 못했습니다.", error);
  }
}
