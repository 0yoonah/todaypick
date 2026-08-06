import { describe, expect, it } from "vitest";
import { FEED_CATEGORY } from "@/config/constants";
import {
  getFeedOverviewHref,
  getHomePreviewItems,
  HOME_PREVIEW_COUNT,
} from "@/utils/homeFeedUtils";

describe("getFeedOverviewHref", () => {
  it("RSS 탭은 기존 카테고리 목록으로 연결한다", () => {
    expect(getFeedOverviewHref(FEED_CATEGORY.IT_NEWS)).toBe(
      "/feeds?category=it_news"
    );
    expect(getFeedOverviewHref(FEED_CATEGORY.TECH_BLOG)).toBe(
      "/feeds?category=tech_blog"
    );
  });

  it("게시글 탭은 게시글 목록으로 연결한다", () => {
    expect(getFeedOverviewHref("writing")).toBe("/feeds?category=writing");
  });
});

describe("getHomePreviewItems", () => {
  it("기본으로 최대 3개만 노출한다", () => {
    expect(HOME_PREVIEW_COUNT).toBe(3);
    expect(getHomePreviewItems([1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
  });

  it("항목이 미리보기 개수보다 적으면 있는 만큼만 반환한다", () => {
    expect(getHomePreviewItems([1, 2])).toEqual([1, 2]);
    expect(getHomePreviewItems([])).toEqual([]);
  });

  it("개수를 직접 지정할 수 있고 0 이하면 전체를 반환한다", () => {
    expect(getHomePreviewItems([1, 2, 3], 1)).toEqual([1]);
    expect(getHomePreviewItems([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });
});
