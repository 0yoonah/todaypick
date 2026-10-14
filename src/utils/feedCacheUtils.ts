import { FEED_CATEGORY } from "../config/constants";
import type { Feed, FeedCategory, FeedPage } from "../types/feed";

export type { FeedPage };

export interface InfiniteFeedData {
  pages: FeedPage[];
  /** 스크랩 탭은 페이지 번호, IT 뉴스·테크 블로그는 커서(첫 페이지는 null)다. */
  pageParams: (number | string | null)[];
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
    pages: data.pages.map((page): FeedPage => {
      const feeds = shouldRemove
        ? page.feeds.filter((cachedFeed) => cachedFeed.id !== feed.id)
        : page.feeds.map((cachedFeed) =>
            cachedFeed.id === feed.id
              ? { ...cachedFeed, is_scraped: !feed.is_scraped }
              : cachedFeed
          );

      // 커서 응답에는 개수가 없다. 개수는 페이지 번호로 읽는 스크랩 탭에서만 고친다.
      if (!("totalCount" in page)) return { ...page, feeds };

      const totalCount = shouldRemove
        ? Math.max(0, page.totalCount - 1)
        : page.totalCount;

      return {
        ...page,
        feeds,
        totalCount,
        totalPages: shouldRemove
          ? Math.ceil(totalCount / Math.max(1, limit))
          : page.totalPages,
      };
    }),
  };
}

export type FeedPageParam = number | string | null;

/** 다음 요청 값. 커서 응답은 nextCursor, 스크랩 응답은 다음 페이지 번호다. 끝이면 undefined. */
export function getNextFeedPageParam(lastPage: FeedPage): FeedPageParam | undefined {
  if ("nextCursor" in lastPage) return lastPage.nextCursor ?? undefined;

  return lastPage.currentPage < lastPage.totalPages
    ? lastPage.currentPage + 1
    : undefined;
}

export function buildFeedRequestParams({
  category,
  limit,
  pageParam,
  interest,
  sourceCategory,
  query,
}: {
  category: FeedCategory;
  limit: number;
  pageParam: FeedPageParam;
  interest?: string;
  sourceCategory?: string;
  query?: string;
}): URLSearchParams {
  const params = new URLSearchParams({
    category,
    limit: limit.toString(),
  });
  if (typeof pageParam === "number") params.set("page", pageParam.toString());
  if (typeof pageParam === "string") params.set("cursor", pageParam);
  if (interest) params.set("interest", interest);
  if (sourceCategory) params.set("sourceCategory", sourceCategory);
  if (query) params.set("q", query);
  return params;
}
