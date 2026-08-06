import { parseInterestIds, type InterestId } from "@/config/interests";
import type {
  WritingDraft,
  WritingSource,
  WritingVisibility,
} from "@/types/writing";

export const MAX_DRAFT_TITLE_LENGTH = 200;
export const MAX_DRAFT_CONTENT_LENGTH = 50000;
export const MAX_DRAFT_SOURCES = 20;
export const MAX_DRAFT_THUMBNAIL_SIZE = 5 * 1024 * 1024;
export const DEFAULT_WRITING_VISIBILITY: WritingVisibility = "public";

/**
 * 수정 화면이 사용하는 본인 글 단건 조회 캐시 키.
 * 공개 게시글 상세(`["writing-draft", id]`)와 응답 형태가 달라 키를 분리한다.
 */
export const ownWritingDraftQueryKey = (draftId: string) =>
  ["writing-draft", draftId, "mine"] as const;

export const DEFAULT_PUBLIC_DRAFT_LIMIT = 12;
export const MAX_PUBLIC_DRAFT_LIMIT = 50;

/**
 * 공개 게시글 목록의 페이지 파라미터를 파싱한다.
 * page와 limit이 모두 없으면 null을 반환해 기존 전체 목록 응답을 유지한다.
 */
export function parseWritingDraftPagination(
  searchParams: URLSearchParams
): { page: number; limit: number } | null {
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  if (pageParam === null && limitParam === null) return null;

  const page = Number(pageParam ?? "1");
  const limit = Number(limitParam ?? DEFAULT_PUBLIC_DRAFT_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("page는 1 이상의 정수여야 합니다.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PUBLIC_DRAFT_LIMIT) {
    throw new TypeError(
      `limit은 1 이상 ${MAX_PUBLIC_DRAFT_LIMIT} 이하의 정수여야 합니다.`
    );
  }

  return { page, limit };
}

/**
 * 최근 수정순으로 정렬하되 같은 시각이면 id로 순서를 고정한다.
 * 마지막 정렬 키가 없으면 페이지 경계에서 항목이 빠지거나 중복될 수 있다.
 */
export function sortPublicDrafts<T extends { id: string; updated_at: string }>(
  drafts: T[]
): T[] {
  return [...drafts].sort(
    (a, b) =>
      b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id)
  );
}

export function paginateDrafts<T>(drafts: T[], page: number, limit: number) {
  const start = (page - 1) * limit;

  return {
    drafts: drafts.slice(start, start + limit),
    totalCount: drafts.length,
    totalPages: Math.ceil(drafts.length / limit),
    currentPage: page,
  };
}

export type WritingFormSnapshot = {
  title: string;
  content: string;
  tags: InterestId[];
  visibility: WritingVisibility;
  sourceIds: string[];
  thumbnailUrl: string | null;
};

/** 에디터의 변경 여부를 비교하기 위한 초기 상태를 만든다. */
export function createWritingFormSnapshot(
  draft: WritingDraft | null | undefined,
  visibility: WritingVisibility = draft?.visibility ??
    DEFAULT_WRITING_VISIBILITY
): WritingFormSnapshot {
  return {
    title: draft?.title ?? "",
    content: draft?.content ?? "",
    tags: draft?.tags ?? [],
    visibility,
    sourceIds: (draft?.sources ?? []).map((source) => source.id),
    thumbnailUrl: draft?.thumbnail_url ?? null,
  };
}

const normalizeIds = (ids: string[]) => [...ids].sort().join("|");

/**
 * 초기 상태와 현재 입력값을 비교해 실제 변경이 있는지 판단한다.
 * 값을 바꿨다가 되돌리면 변경 없음으로 본다.
 */
export function hasWritingFormChanges(
  initial: WritingFormSnapshot,
  current: WritingFormSnapshot,
  hasNewThumbnailFile = false
): boolean {
  if (hasNewThumbnailFile) return true;

  return (
    initial.title.trim() !== current.title.trim() ||
    initial.content.trim() !== current.content.trim() ||
    initial.visibility !== current.visibility ||
    initial.thumbnailUrl !== current.thumbnailUrl ||
    normalizeIds(initial.tags) !== normalizeIds(current.tags) ||
    normalizeIds(initial.sourceIds) !== normalizeIds(current.sourceIds)
  );
}

export function parseWritingSource(value: unknown): WritingSource | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (
    typeof source.id !== "string" ||
    typeof source.title !== "string" ||
    typeof source.url !== "string" ||
    typeof source.source !== "string" ||
    typeof source.category !== "string" ||
    typeof source.published_at !== "string"
  ) return null;

  try {
    const url = new URL(source.url);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
  } catch {
    return null;
  }

  return {
    id: source.id.slice(0, 2048),
    title: source.title.slice(0, 200),
    url: source.url.slice(0, 2048),
    source: source.source.slice(0, 200),
    category: source.category as WritingSource["category"],
    published_at: source.published_at.slice(0, 100),
    interests: parseInterestIds(source.interests),
  };
}

export function parseWritingSources(value: unknown): WritingSource[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, WritingSource>();
  for (const item of value.slice(0, MAX_DRAFT_SOURCES)) {
    const source = parseWritingSource(item);
    if (source && !unique.has(source.id)) unique.set(source.id, source);
  }
  return [...unique.values()];
}

export function parseWritingVisibility(value: unknown): WritingVisibility {
  return value === "private" ? "private" : DEFAULT_WRITING_VISIBILITY;
}

export function parseWritingThumbnailUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (
    value.length <= MAX_DRAFT_THUMBNAIL_SIZE * 1.4 &&
    /^data:image\/(?:jpeg|png|webp|gif);base64,[a-zA-Z0-9+/]+=*$/.test(value)
  ) {
    return value;
  }
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value.slice(0, 2048) : null;
  } catch {
    return null;
  }
}
