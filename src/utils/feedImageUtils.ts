import { isAllowedFeedImageUrl } from "../config/feedImages";
import { decodeHtmlEntities } from "./rssTextUtils";

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const IMAGE_TAG_PATTERN =
  /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i;

type FeedImageCandidate = {
  url?: unknown;
  type?: unknown;
};

function decodeImageUrl(value: string): string {
  return decodeHtmlEntities(value).trim();
}

/** 상대 경로는 글 주소 기준으로 바꾸고, 허용 호스트의 HTTPS 주소만 돌려준다. */
function toAllowedImageUrl(value: string, baseUrl?: string): string | undefined {
  try {
    const url = new URL(decodeImageUrl(value), baseUrl).toString();
    return isAllowedFeedImageUrl(url) ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * enclosure·media 후보는 첨부 파일일 수 있으므로 MIME 타입이나 확장자로 이미지인지 확인한다.
 */
function selectCandidateImageUrl(
  { url, type }: FeedImageCandidate,
  baseUrl?: string
): string | undefined {
  if (typeof url !== "string" || !url) return undefined;

  const allowedUrl = toAllowedImageUrl(url, baseUrl);
  if (!allowedUrl) return undefined;

  if (typeof type === "string" && type.toLowerCase().startsWith("image/")) {
    return allowedUrl;
  }
  return IMAGE_EXTENSION_PATTERN.test(new URL(allowedUrl).pathname)
    ? allowedUrl
    : undefined;
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

/**
 * 글 단위 이미지 후보를 먼저 쓰고, 없으면 본문의 첫 `<img>`를 쓴다.
 * `<img>`는 태그 자체가 이미지이므로 확장자를 검사하지 않는다.
 * `baseUrl`(글 주소)이 있으면 상대 경로를 절대 주소로 바꾼다.
 */
export function selectFeedImageUrl(
  candidates: FeedImageCandidate[],
  htmlValues: unknown[],
  baseUrl?: string
): string | undefined {
  for (const candidate of candidates) {
    const url = selectCandidateImageUrl(candidate, baseUrl);
    if (url) return url;
  }

  const embeddedImageUrl = extractFirstImageUrl(htmlValues);
  return embeddedImageUrl
    ? toAllowedImageUrl(embeddedImageUrl, baseUrl)
    : undefined;
}
