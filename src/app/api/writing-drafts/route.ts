import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isInterestId, parseInterestIds } from "@/config/interests";
import {
  MAX_DRAFT_CONTENT_LENGTH,
  MAX_DRAFT_TITLE_LENGTH,
  MAX_DRAFT_THUMBNAIL_SIZE,
  parseWritingVisibility,
  parseWritingThumbnailUrl,
  parseWritingSources,
} from "@/utils/writingUtils";
import type { WritingDraft } from "@/types/writing";

const selectFields =
  "id, title, content, tags, visibility, thumbnail_url, sources, created_at, updated_at";

async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

function parseDraft(body: unknown) {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const content = typeof value.content === "string" ? value.content : "";
  const tagsValue =
    typeof value.tags === "string"
      ? (() => {
          try {
            return JSON.parse(value.tags || "[]");
          } catch {
            return [];
          }
        })()
      : value.tags;
  const sourcesValue =
    typeof value.sources === "string"
      ? (() => {
          try {
            return JSON.parse(value.sources || "[]");
          } catch {
            return [];
          }
        })()
      : value.sources;
  if (title.length > MAX_DRAFT_TITLE_LENGTH || content.length > MAX_DRAFT_CONTENT_LENGTH) return null;
  return {
    title,
    content,
    tags: parseInterestIds(tagsValue),
    visibility: parseWritingVisibility(value.visibility),
    thumbnail_url: parseWritingThumbnailUrl(value.thumbnail_url),
    sources: parseWritingSources(sourcesValue),
  };
}

async function parseDraftFromRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());
    const thumbnail = formData.get("thumbnail");
    const thumbnailFile =
      thumbnail instanceof File && thumbnail.size > 0 ? thumbnail : null;
    let thumbnail_url: string | null = null;

    if (thumbnailFile) {
      if (thumbnailFile.size > MAX_DRAFT_THUMBNAIL_SIZE) {
        return { error: "썸네일 크기는 5MB 이하여야 합니다." as const };
      }
      const allowedImageTypes: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      if (!allowedImageTypes[thumbnailFile.type]) {
        return { error: "JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다." as const };
      }
      const bytes = new Uint8Array(await thumbnailFile.arrayBuffer());
      const base64 = Buffer.from(bytes).toString("base64");
      thumbnail_url = `data:${thumbnailFile.type};base64,${base64}`;
    }

    const draft = parseDraft({
      ...body,
      thumbnail_url: thumbnail_url ?? body.thumbnail_url,
    });

    return {
      draft,
      id: typeof body.id === "string" ? body.id : null,
    };
  }

  const payload = await request.json().catch(() => null);
  return {
    draft: parseDraft(payload),
    id:
      payload && typeof payload === "object" && "id" in payload &&
      typeof payload.id === "string"
        ? payload.id
        : null,
  };
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUser();
  const url = new URL(request.url);
  const draftId = url.searchParams.get("id");
  const publicFeed = url.searchParams.get("scope") === "public";
  const interestValue = url.searchParams.get("interest");
  const interest = isInterestId(interestValue) ? interestValue : undefined;
  if (interestValue && !interest) {
    return NextResponse.json({ error: "유효한 관심 분야가 필요합니다." }, { status: 400 });
  }

  if (publicFeed || draftId) {
    const { data: publicDrafts, error: publicError } = await supabase.rpc(
      "get_public_writing_drafts",
      { p_id: draftId }
    );

    if (publicError) {
      console.error(
        `공개 게시글 조회 오류 (${publicError.code}): ${publicError.message}`
      );
      return NextResponse.json(
        { error: "공개 게시글을 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    if (publicFeed) {
      const drafts = interest
        ? (publicDrafts ?? []).filter((draft: WritingDraft) => draft.tags.includes(interest))
        : publicDrafts ?? [];
      return NextResponse.json({ drafts });
    }

    if (publicDrafts?.[0]) {
      return NextResponse.json({ draft: publicDrafts[0] });
    }
  }

  if (draftId) {
    if (!user) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("writing_drafts")
      .select(selectFields)
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single();
    if (error) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ draft: data });
  }

  const query = supabase
    .from("writing_drafts")
    .select(selectFields)
    .order("updated_at", { ascending: false });

  const { data, error } = user
    ? await query.eq("user_id", user.id)
    : await query.eq("visibility", "public");

  if (error) return NextResponse.json({ error: "글 초안을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const parsed = await parseDraftFromRequest(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.draft) return NextResponse.json({ error: "글 초안 입력이 올바르지 않습니다." }, { status: 400 });
  const { data, error } = await supabase.from("writing_drafts").insert({ user_id: user.id, ...parsed.draft }).select(selectFields).single();
  if (error) return NextResponse.json({ error: "글 초안을 만들지 못했습니다." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  const parsed = await parseDraftFromRequest(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.id || !parsed.draft) return NextResponse.json({ error: "글 초안 입력이 올바르지 않습니다." }, { status: 400 });
  const { data, error } = await supabase.from("writing_drafts").update(parsed.draft).eq("id", parsed.id).eq("user_id", user.id).select(selectFields).single();
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
