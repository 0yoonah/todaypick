import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const draftId = body && typeof body.draft_id === "string" ? body.draft_id : "";
  if (!draftId) {
    return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });
  }

  const { data: publicDrafts, error: draftError } = await supabase.rpc(
    "get_public_writing_drafts",
    { p_id: draftId }
  );
  if (draftError || !publicDrafts?.length) {
    return NextResponse.json(
      { error: "공개 게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("writing_bookmarks").upsert(
    { user_id: user.id, draft_id: draftId },
    { onConflict: "user_id,draft_id", ignoreDuplicates: true }
  );

  if (error) {
    console.error(`게시글 북마크 추가 오류 (${error.code}): ${error.message}`);
    return NextResponse.json({ error: "북마크를 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ is_bookmarked: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const draftId = new URL(request.url).searchParams.get("draftId");
  if (!draftId) {
    return NextResponse.json({ error: "게시글 ID가 필요합니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("writing_bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("draft_id", draftId);

  if (error) {
    console.error(`게시글 북마크 해제 오류 (${error.code}): ${error.message}`);
    return NextResponse.json({ error: "북마크를 해제하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ is_bookmarked: false });
}
