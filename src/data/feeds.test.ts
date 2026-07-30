import { describe, expect, it } from "vitest";
import { feedSources, getFeedSources } from "./feeds";

describe("RSS feed source configuration", () => {
  it("uses unique IDs and HTTPS URLs for every configured source", () => {
    const ids = feedSources.map(({ id }) => id);
    const urls = feedSources.map(({ rss_url }) => rss_url);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith("https://"))).toBe(true);
  });

  it("returns only sources in the requested category", () => {
    const techBlogSources = getFeedSources("tech_blog");

    expect(techBlogSources.length).toBeGreaterThan(0);
    expect(
      techBlogSources.every((source) => source.category === "tech_blog")
    ).toBe(true);
  });
});
