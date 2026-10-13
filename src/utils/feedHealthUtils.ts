const DAY_MS = 24 * 60 * 60 * 1000;

export const FEED_STALE_DAYS = 365;
export const FEED_RECENT_DAYS = 90;

export type FeedHealthWarning =
  | "redirected"
  | "stale"
  | "no_dates"
  | "disallowed_image_host";

export type FeedHealthInput = {
  requestedUrl: string;
  finalUrl: string;
  /** 글별 발행 시각(ms). 파싱하지 못한 값은 NaN으로 넘긴다. */
  publishedAts: number[];
  disallowedImageHosts: string[];
  now: number;
};

export type FeedHealthSummary = {
  latestPublishedAt: number | null;
  recentCount: number;
  warnings: FeedHealthWarning[];
};

export function summarizeFeedHealth({
  requestedUrl,
  finalUrl,
  publishedAts,
  disallowedImageHosts,
  now,
}: FeedHealthInput): FeedHealthSummary {
  const validDates = publishedAts.filter(Number.isFinite);
  const latestPublishedAt = validDates.length ? Math.max(...validDates) : null;
  const recentCount = validDates.filter(
    (date) => now - date <= FEED_RECENT_DAYS * DAY_MS
  ).length;

  const warnings: FeedHealthWarning[] = [];
  if (finalUrl !== requestedUrl) warnings.push("redirected");
  if (latestPublishedAt === null) {
    warnings.push("no_dates");
  } else if (now - latestPublishedAt > FEED_STALE_DAYS * DAY_MS) {
    warnings.push("stale");
  }
  if (disallowedImageHosts.length) warnings.push("disallowed_image_host");

  return { latestPublishedAt, recentCount, warnings };
}
