import { describe, expect, it } from "vitest";
import { FEED_CATEGORY } from "../config/constants";
import type { Feed } from "../types/feed";
import {
  buildFeedRequestParams,
  getNextFeedPageParam,
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
    expect(result.pages[0]).toMatchObject({ totalCount: 2, totalPages: 1 });
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

  it("커서 응답 페이지는 개수 필드를 만들지 않고 스크랩 상태와 커서를 유지한다", () => {
    const cursorData: InfiniteFeedData = {
      pages: [{ feeds: [feed("a", false)], nextCursor: "next" }],
      pageParams: [null],
    };

    const result = updateFeedScrapCache(
      cursorData,
      feed("a", false),
      FEED_CATEGORY.TECH_BLOG,
      12
    );

    expect(result.pages[0]).toStrictEqual({
      feeds: [{ ...feed("a", false), is_scraped: true }],
      nextCursor: "next",
    });
  });
});

describe("getNextFeedPageParam", () => {
  it("커서 응답은 nextCursor를 다음 요청 값으로 쓰고, null이면 끝낸다", () => {
    expect(getNextFeedPageParam({ feeds: [], nextCursor: "abc" })).toBe("abc");
    expect(getNextFeedPageParam({ feeds: [], nextCursor: null })).toBeUndefined();
  });

  it("스크랩 응답은 남은 페이지가 있으면 다음 페이지 번호를 준다", () => {
    const page = { feeds: [], currentPage: 1, totalCount: 30, totalPages: 3 };

    expect(getNextFeedPageParam(page)).toBe(2);
    expect(getNextFeedPageParam({ ...page, currentPage: 3 })).toBeUndefined();
  });
});

describe("buildFeedRequestParams", () => {
  it("첫 페이지 커서(null)는 보내지 않는다", () => {
    expect(
      buildFeedRequestParams({ category: "tech_blog", limit: 12, pageParam: null }).toString()
    ).toBe("category=tech_blog&limit=12");
  });

  it("문자열은 cursor로, 숫자는 page로 보낸다", () => {
    expect(
      buildFeedRequestParams({
        category: "tech_blog",
        limit: 12,
        pageParam: "abc",
        interest: "backend",
      }).toString()
    ).toBe("category=tech_blog&limit=12&cursor=abc&interest=backend");
    expect(
      buildFeedRequestParams({
        category: "scraped",
        limit: 12,
        pageParam: 2,
        sourceCategory: "it_news",
      }).toString()
    ).toBe("category=scraped&limit=12&page=2&sourceCategory=it_news");
  });
});
