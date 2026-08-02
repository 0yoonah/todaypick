import { isAllowedFeedImageUrl } from "../config/feedImages";

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const IMAGE_TAG_PATTERN =
  /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i;

type FeedImageCandidate = {
  url?: unknown;
  type?: unknown;
};

function decodeImageUrl(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#38;", "&")
    .trim();
}

function isImageCandidate({ url, type }: FeedImageCandidate): boolean {
  if (typeof url !== "string" || !url) return false;

  const decodedUrl = decodeImageUrl(url);
  if (!isAllowedFeedImageUrl(decodedUrl)) return false;
  if (
    typeof type === "string" &&
    type.toLowerCase().startsWith("image/")
  ) {
    return true;
  }

  return IMAGE_EXTENSION_PATTERN.test(new URL(decodedUrl).pathname);
}

export function extractFirstImageUrl(htmlValues: unknown[]) {
  for (const html of htmlValues) {
    if (typeof html !== "string" || !html) continue;

    const match = IMAGE_TAG_PATTERN.exec(html);
    const url = match?.[1] || match?.[2] || match?.[3];
    if (url) return decodeImageUrl(url);
  }

  return undefined;
}

export function selectFeedImageUrl(
  candidates: FeedImageCandidate[],
  htmlValues: unknown[]
): string | undefined {
  const embeddedImageUrl = extractFirstImageUrl(htmlValues);
  const allCandidates = [
    ...candidates,
    embeddedImageUrl ? { url: embeddedImageUrl } : {},
  ];
  const selected = allCandidates.find(isImageCandidate)?.url;

  return typeof selected === "string"
    ? decodeImageUrl(selected)
    : undefined;
}
