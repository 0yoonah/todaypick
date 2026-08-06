import { describe, expect, it } from "vitest";
import { FEED_CATEGORY } from "@/config/constants";
import {
  getValidCategory,
  isWritingCategory,
  WRITING_CATEGORY,
} from "@/utils/feedUtils";

describe("getValidCategory", () => {
  it("허용된 RSS 카테고리를 그대로 반환한다", () => {
    expect(getValidCategory(FEED_CATEGORY.TECH_BLOG)).toBe(
      FEED_CATEGORY.TECH_BLOG
    );
    expect(getValidCategory(FEED_CATEGORY.IT_NEWS)).toBe(FEED_CATEGORY.IT_NEWS);
  });

  it("알 수 없는 값과 게시글 카테고리는 IT 기사로 대체한다", () => {
    expect(getValidCategory(null)).toBe(FEED_CATEGORY.IT_NEWS);
    expect(getValidCategory("unknown")).toBe(FEED_CATEGORY.IT_NEWS);
    expect(getValidCategory(WRITING_CATEGORY)).toBe(FEED_CATEGORY.IT_NEWS);
  });
});

describe("isWritingCategory", () => {
  it("게시글 카테고리에서만 RSS 쿼리를 비활성화한다", () => {
    expect(isWritingCategory(WRITING_CATEGORY)).toBe(true);
    expect(isWritingCategory(FEED_CATEGORY.IT_NEWS)).toBe(false);
    expect(isWritingCategory(FEED_CATEGORY.TECH_BLOG)).toBe(false);
    expect(isWritingCategory(null)).toBe(false);
    expect(isWritingCategory(undefined)).toBe(false);
  });
});
