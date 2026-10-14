import "server-only";

import { getFeedSources } from "@/data/feeds";
import type { InterestId } from "@/config/interests";
import type { Feed, FeedSource, RSSFeedCategory } from "@/types/feed";
import { inferFeedInterests } from "@/utils/feedInterestUtils";
import { selectFeedImageUrl } from "@/utils/feedImageUtils";
import { cleanRssText } from "@/utils/rssTextUtils";
import {
  getRssItemImageInputs,
  readRssSource,
  RSS_TIMEOUT_MS,
} from "@/services/rssSourceReader";

const RSS_CATEGORIES: RSSFeedCategory[] = ["it_news", "tech_blog"];
// 예약 수집은 기다리는 사용자가 없어 요청 때보다 넉넉하게 잡는다. 수집 API의 maxDuration(60초) 안에 끝나야 한다.
export const COLLECT_BUDGET_MS = 50_000;
const MAX_ITEMS_PER_SOURCE = 50;
const BATCH_SIZE = 5;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_AUTHOR_LENGTH = 100;

export type SourceCollectResult = {
  source: FeedSource;
  feeds: Feed[];
  ok: boolean;
};

/** `feed_items`에 저장하는 한 행. `upsert_feed_items`의 `p_items` 항목과 같다. */
export type FeedItemRow = {
  id: string;
  source_id: string;
  category: RSSFeedCategory;
  title: string;
  description: string;
  image_url: string | null;
  author: string | null;
  interests: InterestId[];
  published_at: string;
};

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";

    url.hash = "";
    url.searchParams.delete("utm_source");
    url.searchParams.delete("utm_medium");
    url.searchParams.delete("utm_campaign");
    return url.toString();
  } catch {
    return "";
  }
}

async function fetchRSSFeed(
  source: FeedSource,
  collectionSignal: AbortSignal
): Promise<SourceCollectResult> {
  try {
    const { feed: parsedFeed } = await readRssSource(
      source.rss_url,
      AbortSignal.any([
        collectionSignal,
        AbortSignal.timeout(RSS_TIMEOUT_MS),
      ])
    );

    const feeds = (parsedFeed.items || [])
      .slice(0, MAX_ITEMS_PER_SOURCE)
      .flatMap((item, index) => {
        const url = item.link ? normalizeUrl(item.link) : "";
        if (!url) return [];

        const publishedAt = item.pubDate || item.isoDate || "";
        const { candidates, htmlValues } = getRssItemImageInputs(item);

        const feed: Feed = {
          id: url || `${source.id}-${publishedAt || index}`,
          title: cleanRssText(
            item.title || "제목 없음",
            MAX_TITLE_LENGTH
          ),
          description: cleanRssText(
            item.content || item.description || item.contentSnippet || "",
            MAX_DESCRIPTION_LENGTH
          ),
          url,
          source: source.name,
          published_at: publishedAt || new Date(0).toISOString(),
          category: source.category,
          // 이미지가 없으면 비워 두고 화면에서 대체 썸네일을 그린다.
          image_url: selectFeedImageUrl(candidates, htmlValues, url),
          author: cleanRssText(
            item.creator || source.name,
            MAX_AUTHOR_LENGTH
          ),
        };
        feed.interests = inferFeedInterests(feed);
        return [feed];
      });

    return { source, feeds, ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : "Unknown";
    console.error(`RSS 피드 수집 실패 (${source.name}): ${message}`);
    return { source, feeds: [], ok: false };
  }
}

/**
 * 카테고리의 활성 출처를 동시에 BATCH_SIZE개씩 수집한다.
 * 출처 하나가 실패해도 나머지는 그대로 돌려준다. 예산 안에 시작하지 못한 출처는 실패로 둔다.
 */
export async function collectSourceResults(
  category: RSSFeedCategory,
  budgetMs: number
): Promise<SourceCollectResult[]> {
  const sources = getFeedSources(category);
  const results: SourceCollectResult[] = sources.map((source) => ({
    source,
    feeds: [],
    ok: false,
  }));
  const collectionSignal = AbortSignal.timeout(budgetMs);
  let nextSourceIndex = 0;

  async function collectNextSource(): Promise<void> {
    while (nextSourceIndex < sources.length && !collectionSignal.aborted) {
      const sourceIndex = nextSourceIndex;
      nextSourceIndex += 1;
      results[sourceIndex] = await fetchRSSFeed(
        sources[sourceIndex],
        collectionSignal
      );
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(BATCH_SIZE, sources.length) },
      collectNextSource
    )
  );

  return results;
}

/**
 * 수집 결과를 저장 형식으로 바꾼다.
 * - 발행 시각을 읽을 수 없는 글은 버린다. 정렬 기준이 없고, SQL의 timestamptz 변환이 요청 전체를 실패시킨다.
 * - 수집 시각보다 미래인 발행 시각은 수집 시각으로 맞춘다. 시간대가 틀린 글이 맨 위에 오래 남지 않게 한다.
 * - 카테고리를 넘어 같은 URL이면 먼저 나온 글 하나만 남긴다.
 */
export function toFeedItemRows(
  results: SourceCollectResult[],
  now: Date
): FeedItemRow[] {
  const rows = new Map<string, FeedItemRow>();
  const nowTime = now.getTime();

  for (const { source, feeds } of results) {
    for (const feed of feeds) {
      if (rows.has(feed.id)) continue;

      const publishedTime = Date.parse(feed.published_at);
      if (!Number.isFinite(publishedTime) || publishedTime <= 0) continue;

      rows.set(feed.id, {
        id: feed.id,
        source_id: source.id,
        category: source.category,
        title: feed.title,
        description: feed.description,
        image_url: feed.image_url ?? null,
        author: feed.author ?? null,
        interests: feed.interests ?? [],
        published_at: new Date(Math.min(publishedTime, nowTime)).toISOString(),
      });
    }
  }

  return [...rows.values()];
}

export async function collectFeedItems(now: Date = new Date()): Promise<{
  items: FeedItemRow[];
  okCount: number;
  failedSourceIds: string[];
}> {
  const results = (
    await Promise.all(
      RSS_CATEGORIES.map((category) =>
        collectSourceResults(category, COLLECT_BUDGET_MS)
      )
    )
  ).flat();

  return {
    items: toFeedItemRows(results, now),
    okCount: results.filter(({ ok }) => ok).length,
    failedSourceIds: results
      .filter(({ ok }) => !ok)
      .map(({ source }) => source.id),
  };
}
