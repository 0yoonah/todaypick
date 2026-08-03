import "server-only";

import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
import { FEED_CATEGORY } from "@/config/constants";
import { DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
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
import {
  assertRssContentType,
  assertSafeRssUrl,
  assertSafeXml,
  readResponseTextWithLimit,
} from "@/utils/rssSecurityUtils";

const RSS_REVALIDATE_SECONDS = 15 * 60;
const RSS_TIMEOUT_MS = 8_000;
const RSS_CATEGORY_TIMEOUT_MS = 12_000;
const RSS_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const RSS_MAX_REDIRECTS = 3;
const MAX_ITEMS_PER_SOURCE = 20;
const BATCH_SIZE = 5;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_AUTHOR_LENGTH = 100;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  const cleaned = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength - 1).trimEnd()}…`
    : cleaned;
}

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

async function fetchRssResponse(
  initialUrl: string,
  signal: AbortSignal
): Promise<Response> {
  let currentUrl = await assertSafeRssUrl(initialUrl);

  for (let redirectCount = 0; redirectCount <= RSS_MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "TodayPick RSS Reader/1.4",
      },
      redirect: "manual",
      signal,
    });

    if (!REDIRECT_STATUS_CODES.has(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location || redirectCount === RSS_MAX_REDIRECTS) {
      throw new Error("RSS 리다이렉트 횟수 제한을 초과했습니다.");
    }

    await response.body?.cancel();
    currentUrl = await assertSafeRssUrl(
      new URL(location, currentUrl).toString()
    );
  }

  throw new Error("RSS 요청을 완료하지 못했습니다.");
}

async function fetchRSSFeed(
  source: FeedSource,
  collectionSignal: AbortSignal
): Promise<Feed[]> {
  try {
    const response = await fetchRssResponse(
      source.rss_url,
      AbortSignal.any([
        collectionSignal,
        AbortSignal.timeout(RSS_TIMEOUT_MS),
      ])
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    assertRssContentType(response.headers.get("content-type"));
    const xml = await readResponseTextWithLimit(
      response,
      RSS_MAX_RESPONSE_BYTES
    );
    assertSafeXml(xml);

    const parser = new Parser({
      customFields: {
        feed: ["image", "icon", "logo"],
        item: [
          "media:content",
          "media:thumbnail",
          "enclosure",
          "content:encoded",
          "description",
        ],
      },
    });
    const parsedFeed = await parser.parseString(xml);

    return (parsedFeed.items || [])
      .slice(0, MAX_ITEMS_PER_SOURCE)
      .flatMap((item, index) => {
        const url = item.link ? normalizeUrl(item.link) : "";
        if (!url) return [];

        const publishedAt = item.pubDate || item.isoDate || "";
        const htmlValues = [
          item["content:encoded"],
          item.content,
          item.description,
          item.summary,
        ];

        const feed: Feed = {
          id: url || `${source.id}-${publishedAt || index}`,
          title: cleanText(
            item.title || "제목 없음",
            MAX_TITLE_LENGTH
          ),
          description: cleanText(
            item.content || item.description || item.contentSnippet || "",
            MAX_DESCRIPTION_LENGTH
          ),
          url,
          source: source.name,
          published_at: publishedAt || new Date(0).toISOString(),
          category: source.category,
          image_url:
            selectFeedImageUrl(
              [
                {
                  url: item.enclosure?.url,
                  type: item.enclosure?.type,
                },
                {
                  url: item["media:content"]?.$?.url,
                  type: item["media:content"]?.$?.type,
                },
                {
                  url: item["media:thumbnail"]?.$?.url,
                  type: item["media:thumbnail"]?.$?.type,
                },
                {
                  url: parsedFeed.image?.url,
                  type: "image/*",
                },
                {
                  url: parsedFeed.logo,
                  type: "image/*",
                },
                {
                  url: parsedFeed.icon,
                  type: "image/*",
                },
              ],
              htmlValues
            ) || DEFAULT_FEED_IMAGE_URL,
          author: cleanText(
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
  ["rss-category-feeds-v6"],
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
