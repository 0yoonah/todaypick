const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

type FeedImageCandidate = {
  url?: string;
  type?: string;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isImageCandidate(candidate: FeedImageCandidate): boolean {
  const { url, type } = candidate;
  if (!url || !isHttpUrl(url)) return false;
  if (type?.toLowerCase().startsWith("image/")) return true;

  try {
    return IMAGE_EXTENSION_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function selectFeedImageUrl(
  candidates: FeedImageCandidate[]
): string | undefined {
  return candidates.find(isImageCandidate)?.url;
}
