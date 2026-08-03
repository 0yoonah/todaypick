import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedSource, RSSFeedCategory } from "@/types/feed";

const testState = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  getFeedSources: vi.fn(),
  assertSafeRssUrl: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  unstable_cache:
    <Args extends unknown[], Result>(
      callback: (...args: Args) => Promise<Result>
    ) =>
    async (...args: Args): Promise<Result> => {
      const key = JSON.stringify(args);
      if (!testState.cache.has(key)) {
        testState.cache.set(key, await callback(...args));
      }
      return testState.cache.get(key) as Result;
    },
}));

vi.mock("@/data/feeds", () => ({
  getFeedSources: testState.getFeedSources,
}));

vi.mock("@/utils/rssSecurityUtils", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/utils/rssSecurityUtils")
  >();
  return { ...actual, assertSafeRssUrl: testState.assertSafeRssUrl };
});

import { getRSSFeedsWithPagination } from "./rssFeedService";

const source = (
  id: string,
  category: RSSFeedCategory = "tech_blog"
): FeedSource => ({
  id,
  name: id,
  rss_url: `https://${id}.example.com/feed.xml`,
  category,
});

const rss = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel><title>테스트</title>${items}</channel></rss>`;

const item = ({
  title,
  link,
  date,
  description = "짧은 설명",
}: {
  title: string;
  link: string;
  date?: string;
  description?: string;
}) => `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link.replaceAll("&", "&amp;")}</link>
  ${date ? `<pubDate>${date}</pubDate>` : ""}
  <description><![CDATA[${description}]]></description>
</item>`;

const xmlResponse = (body: string, status = 200, headers = {}) =>
  new Response(body, {
    status,
    headers: { "content-type": "application/rss+xml", ...headers },
  });

describe("RSS feed service integration", () => {
  beforeEach(() => {
    testState.cache.clear();
    testState.getFeedSources.mockReset();
    testState.assertSafeRssUrl.mockReset();
    testState.assertSafeRssUrl.mockImplementation(async (value: string) =>
      new URL(value)
    );
    vi.restoreAllMocks();
  });

  it("isolates malformed sources and returns sanitized, deterministic feeds", async () => {
    const healthy = source("healthy");
    const broken = source("broken");
    testState.getFeedSources.mockReturnValue([healthy, broken]);

    const healthyXml = rss(
      item({
        title: "B 기사",
        link: "https://example.com/b?utm_source=rss",
        description: "<script>위험</script><b>안전한 설명</b>",
      }) +
        item({
          title: "A 기사",
          link: "https://example.com/a",
        }) +
        item({
          title: "중복 기사",
          link: "https://example.com/a",
        })
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = input.toString();
        return url.includes("healthy")
          ? xmlResponse(healthyXml)
          : xmlResponse("<rss><broken>");
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await getRSSFeedsWithPagination("tech_blog", 1, 10);

    expect(result.feeds.map(({ url }) => url)).toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
    expect(result.feeds[1].description).toBe("안전한 설명");
    expect(result.totalCount).toBe(2);
  });

  it("follows a validated redirect before parsing the RSS response", async () => {
    testState.getFeedSources.mockReturnValue([source("redirect")]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://cdn.example.com/feed.xml" },
        })
      )
      .mockResolvedValueOnce(
        xmlResponse(
          rss(
            item({
              title: "리다이렉트 기사",
              link: "https://example.com/redirected",
            })
          )
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getRSSFeedsWithPagination("tech_blog", 1, 10);

    expect(result.feeds).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(testState.assertSafeRssUrl).toHaveBeenNthCalledWith(
      2,
      "https://cdn.example.com/feed.xml"
    );
  });

  it("keeps healthy sources when another source times out", async () => {
    testState.getFeedSources.mockReturnValue([
      source("timeout"),
      source("healthy"),
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        if (input.toString().includes("timeout")) {
          throw new DOMException("시간 초과", "TimeoutError");
        }
        return xmlResponse(
          rss(
            item({
              title: "정상 기사",
              link: "https://example.com/healthy",
            })
          )
        );
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await getRSSFeedsWithPagination("tech_blog", 1, 10);

    expect(result.feeds.map(({ title }) => title)).toEqual(["정상 기사"]);
  });

  it("reuses category cache and separates different categories", async () => {
    testState.getFeedSources.mockImplementation((category: RSSFeedCategory) => [
      source(category, category),
    ]);
    const fetchMock = vi.fn(async (input: string | URL | Request) =>
      xmlResponse(
        rss(
          item({
            title: input.toString(),
            link: `https://example.com/${input.toString().includes("it_news") ? "news" : "blog"}`,
          })
        )
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await getRSSFeedsWithPagination("tech_blog", 1, 10);
    await getRSSFeedsWithPagination("tech_blog", 1, 10);
    await getRSSFeedsWithPagination("it_news", 1, 10);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(testState.getFeedSources).toHaveBeenCalledTimes(2);
  });

  it("filters by inferred interest before pagination", async () => {
    testState.getFeedSources.mockReturnValue([source("interests")]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        xmlResponse(
          rss(
            item({
              title: "React 브라우저 렌더링 개선",
              link: "https://example.com/frontend",
            }) +
              item({
                title: "서버 API 설계 원칙",
                link: "https://example.com/backend",
              })
          )
        )
      )
    );

    const result = await getRSSFeedsWithPagination(
      "tech_blog",
      1,
      1,
      [],
      "backend"
    );

    expect(result.feeds.map(({ url }) => url)).toEqual([
      "https://example.com/backend",
    ]);
    expect(result.totalCount).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("does not classify partial English keyword matches", async () => {
    testState.getFeedSources.mockReturnValue([source("boundaries")]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        xmlResponse(
          rss(
            item({
              title: "KAPIE 협약 소식",
              link: "https://example.com/kapie",
              description: "농산업 혁신 협력",
            })
          )
        )
      )
    );

    const result = await getRSSFeedsWithPagination(
      "tech_blog",
      1,
      10,
      [],
      "backend"
    );

    expect(result.feeds).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("keeps up to fifty items from each RSS source", async () => {
    testState.getFeedSources.mockReturnValue([source("large")]);
    const items = Array.from({ length: 60 }, (_, index) =>
      item({
        title: `백엔드 서버 글 ${index}`,
        link: `https://example.com/backend-${index}`,
      })
    ).join("");
    vi.stubGlobal("fetch", vi.fn(async () => xmlResponse(rss(items))));

    const result = await getRSSFeedsWithPagination(
      "tech_blog",
      1,
      50,
      [],
      "backend"
    );

    expect(result.feeds).toHaveLength(50);
    expect(result.totalCount).toBe(50);
    expect(result.totalPages).toBe(1);
  });
});
