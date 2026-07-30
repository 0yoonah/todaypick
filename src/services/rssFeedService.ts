import "server-only";

import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
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

const RSS_REVALIDATE_SECONDS = 15 * 60;
const RSS_TIMEOUT_MS = 8_000;
const MAX_ITEMS_PER_SOURCE = 20;
const BATCH_SIZE = 5;

function cleanDescription(description: string): string {
  return description
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.delete("utm_source");
    url.searchParams.delete("utm_medium");
    url.searchParams.delete("utm_campaign");
    return url.toString();
  } catch {
    return value.trim();
  }
}

async function fetchRSSFeed(source: FeedSource): Promise<Feed[]> {
  try {
    const response = await fetch(source.rss_url, {
      headers: { "User-Agent": "TodayPick RSS Reader/1.2" },
      signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const parser = new Parser({
      customFields: {
        feed: ["image"],
        item: ["media:content", "media:thumbnail", "enclosure"],
      },
    });
    const parsedFeed = await parser.parseString(await response.text());

    return (parsedFeed.items || [])
      .slice(0, MAX_ITEMS_PER_SOURCE)
      .map((item, index) => {
        const url = item.link ? normalizeUrl(item.link) : "";
        const publishedAt = item.pubDate || item.isoDate || "";

        const feed: Feed = {
          id: url || `${source.id}-${publishedAt || index}`,
          title: item.title || "제목 없음",
          description: cleanDescription(
            item.contentSnippet || item.content || ""
          ),
          url,
          source: source.name,
          published_at: publishedAt || new Date(0).toISOString(),
          category: source.category,
          image_url:
            item.enclosure?.url ||
            item["media:content"]?.$?.url ||
            item["media:thumbnail"]?.$?.url ||
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop&crop=center",
          author: item.creator || source.name,
        };
        feed.interests = inferFeedInterests(feed);
        return feed;
      });
  } catch (error) {
    console.error(`RSS 피드 수집 실패 (${source.name}):`, error);
    return [];
  }
}

async function collectCategoryFeeds(category: RSSFeedCategory): Promise<Feed[]> {
  const sources = getFeedSources(category);
  const feeds: Feed[] = [];

  for (let index = 0; index < sources.length; index += BATCH_SIZE) {
    const batch = sources.slice(index, index + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchRSSFeed));
    feeds.push(...results.flat());
  }

  const uniqueFeeds = new Map<string, Feed>();
  for (const feed of feeds) {
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
  ["rss-category-feeds-v1"],
  { revalidate: RSS_REVALIDATE_SECONDS }
);

export async function getRSSFeedsWithPagination(
  category: FeedCategory,
  page: number,
  limit: number,
  selectedInterests: InterestId[] = []
) {
  if (category === FEED_CATEGORY.SCRAPED) {
    throw new Error("스크랩 피드는 RSS 수집 대상이 아닙니다.");
  }

  const feeds = sortFeedsByInterests(
    await getCachedCategoryFeeds(category),
    selectedInterests
  );
  const totalCount = feeds.length;
  const startIndex = (page - 1) * limit;

  return {
    feeds: feeds.slice(startIndex, startIndex + limit),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}
