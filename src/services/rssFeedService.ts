import "server-only";

import { unstable_cache } from "next/cache";
import { FEED_CATEGORY } from "@/config/constants";
import { getFeedSources } from "@/data/feeds";
import type {
  Feed,
  FeedCategory,
  FeedSource,
  RSSFeedCategory,
} from "@/types/feed";
import type { InterestId } from "@/config/interests";
import {
  inferFeedInterests,
  sortFeedsByInterests,
} from "@/utils/feedInterestUtils";
import { selectFeedImageUrl } from "@/utils/feedImageUtils";
import { cleanRssText } from "@/utils/rssTextUtils";
import {
  getRssItemImageInputs,
  readRssSource,
  RSS_TIMEOUT_MS,
} from "@/services/rssSourceReader";

const RSS_REVALIDATE_SECONDS = 15 * 60;
const RSS_CATEGORY_TIMEOUT_MS = 12_000;
const MAX_ITEMS_PER_SOURCE = 50;
const BATCH_SIZE = 5;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_AUTHOR_LENGTH = 100;

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
): Promise<Feed[]> {
  try {
    const { feed: parsedFeed } = await readRssSource(
      source.rss_url,
      AbortSignal.any([
        collectionSignal,
        AbortSignal.timeout(RSS_TIMEOUT_MS),
      ])
    );

    return (parsedFeed.items || [])
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
          image_url: selectFeedImageUrl(candidates, htmlValues),
          author: cleanRssText(
            item.creator || source.name,
            MAX_AUTHOR_LENGTH
          ),
        };
        feed.interests = inferFeedInterests(feed);
        return [feed];
      });
  } catch (error) {
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : "Unknown";
    console.error(`RSS 피드 수집 실패 (${source.name}): ${message}`);
    return [];
  }
}

async function collectCategoryFeeds(category: RSSFeedCategory): Promise<Feed[]> {
  const sources = getFeedSources(category);
  const sourceResults: Feed[][] = Array.from(
    { length: sources.length },
    () => []
  );
  const collectionSignal = AbortSignal.timeout(RSS_CATEGORY_TIMEOUT_MS);
  let nextSourceIndex = 0;

  async function collectNextSource(): Promise<void> {
    while (nextSourceIndex < sources.length && !collectionSignal.aborted) {
      const sourceIndex = nextSourceIndex;
      nextSourceIndex += 1;
      sourceResults[sourceIndex] = await fetchRSSFeed(
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

  const uniqueFeeds = new Map<string, Feed>();
  for (const feed of sourceResults.flat()) {
    const key = feed.url || feed.id;
    if (!uniqueFeeds.has(key)) {
      uniqueFeeds.set(key, feed);
    }
  }

  return [...uniqueFeeds.values()].sort((a, b) => {
    const publishedDiff =
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    return publishedDiff || a.id.localeCompare(b.id);
  });
}

const getCachedCategoryFeeds = unstable_cache(
  collectCategoryFeeds,
  ["rss-category-feeds-v7"],
  { revalidate: RSS_REVALIDATE_SECONDS }
);

export async function getRSSFeedsWithPagination(
  category: FeedCategory,
  page: number,
  limit: number,
  selectedInterests: InterestId[] = [],
  filterInterest?: InterestId
) {
  if (category === FEED_CATEGORY.SCRAPED) {
    throw new Error("스크랩 피드는 RSS 수집 대상이 아닙니다.");
  }

  const sortedFeeds = sortFeedsByInterests(
    await getCachedCategoryFeeds(category),
    selectedInterests
  );
  const feeds = filterInterest
    ? sortedFeeds.filter((feed) => feed.interests?.includes(filterInterest))
    : sortedFeeds;
  const totalCount = feeds.length;
  const startIndex = (page - 1) * limit;

  return {
    feeds: feeds.slice(startIndex, startIndex + limit),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}
