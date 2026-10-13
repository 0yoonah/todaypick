// RSS 소스 상태를 점검한다. 외부 네트워크 상태에 따라 결과가 달라지므로 CI에서는 실행하지 않는다.
// 사용법: npm run check:feeds

import { isAllowedFeedImageUrl } from "@/config/feedImages";
import { feedSources } from "@/data/feeds";
import {
  getRssItemImageInputs,
  readRssSource,
  RSS_TIMEOUT_MS,
} from "@/services/rssSourceReader";
import type { FeedSource } from "@/types/feed";
import {
  FEED_RECENT_DAYS,
  FEED_STALE_DAYS,
  summarizeFeedHealth,
  type FeedHealthSummary,
  type FeedHealthWarning,
} from "@/utils/feedHealthUtils";
import {
  extractFirstImageUrl,
  selectFeedImageUrl,
} from "@/utils/feedImageUtils";

const WARNING_LABELS: Record<FeedHealthWarning, string> = {
  redirected: "리다이렉트",
  stale: `${FEED_STALE_DAYS}일 이상 미갱신`,
  no_dates: "발행일 없음",
  disallowed_image_host: "허용 목록 밖 이미지 호스트",
};

type CheckResult =
  | {
      source: FeedSource;
      ok: true;
      finalUrl: string;
      itemCount: number;
      imageHosts: string[];
      disallowedImageHosts: string[];
      summary: FeedHealthSummary;
    }
  | { source: FeedSource; ok: false; error: string };

function toAbsoluteUrl(value: string, baseUrl: string): URL | null {
  try {
    return new URL(value, baseUrl);
  } catch {
    return null;
  }
}

async function checkSource(source: FeedSource, now: number): Promise<CheckResult> {
  try {
    const { finalUrl, feed } = await readRssSource(
      source.rss_url,
      AbortSignal.timeout(RSS_TIMEOUT_MS)
    );
    const imageHosts = new Set<string>();
    const disallowedImageHosts = new Set<string>();

    for (const item of feed.items) {
      const { candidates, htmlValues } = getRssItemImageInputs(item, feed);
      const selected = selectFeedImageUrl(candidates, htmlValues);
      if (selected) {
        const url = toAbsoluteUrl(selected, finalUrl);
        if (url) imageHosts.add(url.hostname);
        continue;
      }

      // 서비스가 고르지 못한 글 이미지 중 호스트 때문에 빠진 것만 남긴다.
      // 상대 경로는 절대 주소로 바꿔 판정해 허용 호스트의 오탐을 막는다.
      const rawImageUrl =
        candidates
          .slice(0, 3)
          .map((candidate) => candidate.url)
          .find((url): url is string => typeof url === "string" && !!url) ??
        extractFirstImageUrl(htmlValues);
      const url = rawImageUrl ? toAbsoluteUrl(rawImageUrl, finalUrl) : null;
      if (url && !isAllowedFeedImageUrl(url.toString())) {
        disallowedImageHosts.add(url.hostname);
      }
    }

    return {
      source,
      ok: true,
      finalUrl,
      itemCount: feed.items.length,
      imageHosts: [...imageHosts],
      disallowedImageHosts: [...disallowedImageHosts],
      summary: summarizeFeedHealth({
        requestedUrl: source.rss_url,
        finalUrl,
        publishedAts: feed.items.map((item) =>
          Date.parse(item.isoDate || item.pubDate || "")
        ),
        disallowedImageHosts: [...disallowedImageHosts],
        now,
      }),
    };
  } catch (error) {
    return {
      source,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatDate(value: number | null): string {
  return value === null ? "-" : new Date(value).toISOString().slice(0, 10);
}

async function main() {
  const now = Date.now();
  const results = await Promise.all(
    feedSources.map((source) => checkSource(source, now))
  );

  console.table(
    results.map((result) =>
      result.ok
        ? {
            id: result.source.id,
            상태: result.summary.warnings.length ? "경고" : "정상",
            최근글: formatDate(result.summary.latestPublishedAt),
            [`${FEED_RECENT_DAYS}일`]: result.summary.recentCount,
            글수: result.itemCount,
            이미지호스트: result.imageHosts.join(", ") || "-",
          }
        : {
            id: result.source.id,
            상태: "실패",
            최근글: "-",
            [`${FEED_RECENT_DAYS}일`]: "-",
            글수: "-",
            이미지호스트: "-",
          }
    )
  );

  const failures = results.filter((result) => !result.ok);
  const warnings = results.filter(
    (result) => result.ok && result.summary.warnings.length
  );

  for (const result of failures) {
    if (!result.ok) console.log(`✗ ${result.source.id}: ${result.error}`);
  }
  for (const result of warnings) {
    if (!result.ok) continue;
    const details = result.summary.warnings.map((warning) => {
      if (warning === "redirected") {
        return `${WARNING_LABELS[warning]} → ${result.finalUrl}`;
      }
      if (warning === "disallowed_image_host") {
        return `${WARNING_LABELS[warning]}: ${result.disallowedImageHosts.join(", ")}`;
      }
      return WARNING_LABELS[warning];
    });
    console.log(`! ${result.source.id}: ${details.join(" / ")}`);
  }

  console.log(
    `\n소스 ${results.length}곳 · 실패 ${failures.length} · 경고 ${warnings.length}`
  );
  // 실패만 종료 코드에 반영한다. 경고는 사람이 판단할 항목이다.
  process.exitCode = failures.length ? 1 : 0;
}

void main();
