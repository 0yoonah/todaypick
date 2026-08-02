import { parseInterestIds } from "@/config/interests";
import type { WritingSource } from "@/types/writing";

export const MAX_DRAFT_TITLE_LENGTH = 200;
export const MAX_DRAFT_CONTENT_LENGTH = 50000;
export const MAX_DRAFT_SOURCES = 20;

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
