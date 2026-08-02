import { describe, expect, it } from "vitest";
import type { Feed } from "@/types/feed";
import { prepareFeedForStorage } from "./feedRightsUtils";

describe("feed rights storage policy", () => {
  it("removes external image URLs without mutating the displayed feed", () => {
    const feed: Feed = {
      id: "https://example.com/article",
      title: "테스트 기사",
      description: "짧은 설명",
      url: "https://example.com/article",
      source: "테스트 출처",
      published_at: "2026-08-02T00:00:00.000Z",
      category: "it_news",
      image_url: "https://cdn.example.com/image.jpg",
    };

    expect(prepareFeedForStorage(feed)).not.toHaveProperty("image_url");
    expect(feed.image_url).toBe("https://cdn.example.com/image.jpg");
  });
});
