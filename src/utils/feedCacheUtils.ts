import { FEED_CATEGORY } from "../config/constants";
import type { Feed, FeedCategory } from "../types/feed";

export interface FeedPage {
  feeds: Feed[];
  currentPage: number;
  totalCount: number;
  totalPages: number;
}

export interface InfiniteFeedData {
  pages: FeedPage[];
  pageParams: number[];
}

export function updateFeedScrapCache(
  data: InfiniteFeedData,
  feed: Feed,
  category: FeedCategory | undefined,
  limit: number
): InfiniteFeedData {
  const shouldRemove =
    feed.is_scraped === true &&
    category === FEED_CATEGORY.SCRAPED &&
    data.pages.some((page) =>
      page.feeds.some((cachedFeed) => cachedFeed.id === feed.id)
    );

  return {
    ...data,
    pages: data.pages.map((page) => {
      const totalCount = shouldRemove
        ? Math.max(0, page.totalCount - 1)
        : page.totalCount;

      return {
        ...page,
        feeds: shouldRemove
          ? page.feeds.filter((cachedFeed) => cachedFeed.id !== feed.id)
          : page.feeds.map((cachedFeed) =>
              cachedFeed.id === feed.id
                ? { ...cachedFeed, is_scraped: !feed.is_scraped }
                : cachedFeed
            ),
        totalCount,
        totalPages: shouldRemove
          ? Math.ceil(totalCount / Math.max(1, limit))
          : page.totalPages,
      };
    }),
  };
}
