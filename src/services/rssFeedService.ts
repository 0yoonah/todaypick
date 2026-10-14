import "server-only";

import { unstable_cache } from "next/cache";
import { FEED_CATEGORY } from "@/config/constants";
import type { Feed, FeedCategory, RSSFeedCategory } from "@/types/feed";
import type { InterestId } from "@/config/interests";
import { sortFeedsByInterests } from "@/utils/feedInterestUtils";
import { collectSourceResults } from "@/services/feedCollector";

const RSS_REVALIDATE_SECONDS = 15 * 60;
const RSS_CATEGORY_TIMEOUT_MS = 12_000;

async function collectCategoryFeeds(category: RSSFeedCategory): Promise<Feed[]> {
  const sourceResults = await collectSourceResults(
    category,
    RSS_CATEGORY_TIMEOUT_MS
  );

  const uniqueFeeds = new Map<string, Feed>();
  for (const { feeds } of sourceResults) {
    for (const feed of feeds) {
      const key = feed.url || feed.id;
      if (!uniqueFeeds.has(key)) {
        uniqueFeeds.set(key, feed);
      }
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
  ["rss-category-feeds-v8"],
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
