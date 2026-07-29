import { describe, expect, it } from "vitest";
import type { Feed } from "@/types/feed";
import { inferFeedInterests, sortFeedsByInterests } from "./feedInterestUtils";

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

  it("선택한 관심 분야의 콘텐츠를 최신 콘텐츠보다 우선한다", () => {
    const recent = createFeed({
      id: "recent",
      published_at: "2026-07-29T00:00:00.000Z",
      interests: ["backend"],
    });
    const preferred = createFeed({
      id: "preferred",
      published_at: "2026-07-28T00:00:00.000Z",
      interests: ["security"],
    });

    expect(sortFeedsByInterests([recent, preferred], ["security"])[0].id).toBe(
      "preferred"
    );
  });

  it("관심 분야가 없으면 기존 순서를 유지한다", () => {
    const feeds = [
      createFeed({ id: "first" }),
      createFeed({ id: "second" }),
    ];

    expect(sortFeedsByInterests(feeds, [])).toEqual(feeds);
  });

  it("같은 관심 점수에서는 최신순과 ID 순으로 안정 정렬한다", () => {
    const feeds = [
      createFeed({
        id: "b",
        published_at: "2026-07-28T00:00:00.000Z",
        interests: ["frontend"],
      }),
      createFeed({
        id: "a",
        published_at: "2026-07-28T00:00:00.000Z",
        interests: ["frontend"],
      }),
    ];

    expect(sortFeedsByInterests(feeds, ["frontend"]).map(({ id }) => id)).toEqual(
      ["a", "b"]
    );
  });
});
