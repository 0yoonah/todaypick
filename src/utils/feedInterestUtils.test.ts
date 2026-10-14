import { describe, expect, it } from "vitest";
import type { Feed } from "@/types/feed";
import { inferFeedInterests } from "./feedInterestUtils";

const createFeed = (overrides: Partial<Feed>): Feed => ({
  id: "feed",
  title: "제목",
  description: "",
  url: "https://example.com",
  source: "테스트",
  published_at: "2026-07-29T00:00:00.000Z",
  category: "tech_blog",
  ...overrides,
});

describe("피드 관심 분야", () => {
  it("제목과 설명의 키워드로 관심 분야를 분류한다", () => {
    expect(
      inferFeedInterests(
        createFeed({
          title: "React UI와 TypeScript로 프론트엔드 개선하기",
        })
      )
    ).toContain("frontend");
  });
});
