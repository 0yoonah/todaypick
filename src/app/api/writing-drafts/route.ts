import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseInterestIds } from "@/config/interests";
import {
  MAX_DRAFT_CONTENT_LENGTH,
  MAX_DRAFT_TITLE_LENGTH,
  parseWritingSources,
} from "@/utils/writingUtils";

const selectFields = "id, title, content, tags, sources, created_at, updated_at";

async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

function parseDraft(body: unknown) {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const content = typeof value.content === "string" ? value.content : "";
  if (title.length > MAX_DRAFT_TITLE_LENGTH || content.length > MAX_DRAFT_CONTENT_LENGTH) return null;
  return { title, content, tags: parseInterestIds(value.tags), sources: parseWritingSources(value.sources) };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.from("writing_drafts").select(selectFields).eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "글 초안을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const draft = parseDraft(await request.json().catch(() => null));
  if (!draft) return NextResponse.json({ error: "글 초안 입력이 올바르지 않습니다." }, { status: 400 });
  const { data, error } = await supabase.from("writing_drafts").insert({ user_id: user.id, ...draft }).select(selectFields).single();
  if (error) return NextResponse.json({ error: "글 초안을 만들지 못했습니다." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const draft = parseDraft(body);
  if (!body || typeof body.id !== "string" || !draft) return NextResponse.json({ error: "글 초안 입력이 올바르지 않습니다." }, { status: 400 });
  const { data, error } = await supabase.from("writing_drafts").update(draft).eq("id", body.id).eq("user_id", user.id).select(selectFields).single();
  if (error) return NextResponse.json({ error: "글 초안을 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "삭제할 초안이 필요합니다." }, { status: 400 });
  const { error } = await supabase.from("writing_drafts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "글 초안을 삭제하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ success: true });
}
