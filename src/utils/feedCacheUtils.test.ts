import { describe, expect, it } from "vitest";
import { FEED_CATEGORY } from "../config/constants";
import type { Feed } from "../types/feed";
import {
  type InfiniteFeedData,
  updateFeedScrapCache,
} from "./feedCacheUtils";

const feed = (id: string, isScraped: boolean): Feed => ({
  id,
  title: id,
  description: "",
  url: `https://example.com/${id}`,
  source: "test",
  published_at: "2026-07-27T00:00:00.000Z",
  category: FEED_CATEGORY.IT_NEWS,
  is_scraped: isScraped,
});

const data = (feeds: Feed[], totalCount = feeds.length): InfiniteFeedData => ({
  pages: [
    {
      feeds,
      currentPage: 1,
      totalCount,
      totalPages: Math.ceil(totalCount / 2),
    },
  ],
  pageParams: [1],
});

describe("updateFeedScrapCache", () => {
  it("일반 피드에서 스크랩 상태를 즉시 반영한다", () => {
    const result = updateFeedScrapCache(
      data([feed("a", false)]),
      feed("a", false),
      FEED_CATEGORY.IT_NEWS,
      2
    );

    expect(result.pages[0].feeds[0].is_scraped).toBe(true);
  });

  it("스크랩 탭에서 해제한 피드를 제거하고 개수를 갱신한다", () => {
    const result = updateFeedScrapCache(
      data([feed("a", true), feed("b", true)], 3),
      feed("a", true),
      FEED_CATEGORY.SCRAPED,
      2
    );

    expect(result.pages[0].feeds.map(({ id }) => id)).toEqual(["b"]);
    expect(result.pages[0].totalCount).toBe(2);
    expect(result.pages[0].totalPages).toBe(1);
  });

  it("캐시에 없는 피드를 해제해도 개수를 줄이지 않는다", () => {
    const original = data([feed("a", true)], 1);
    const result = updateFeedScrapCache(
      original,
      feed("missing", true),
      FEED_CATEGORY.SCRAPED,
      2
    );

    expect(result).toEqual(original);
  });
});
