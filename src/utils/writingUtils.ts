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
