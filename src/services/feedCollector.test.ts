import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Feed, FeedSource, RSSFeedCategory } from "@/types/feed";

const testState = vi.hoisted(() => ({
  getFeedSources: vi.fn(),
  assertSafeRssUrl: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/data/feeds", () => ({
  getFeedSources: testState.getFeedSources,
}));

vi.mock("@/utils/rssSecurityUtils", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/utils/rssSecurityUtils")
  >();
  return { ...actual, assertSafeRssUrl: testState.assertSafeRssUrl };
});

import { collectFeedItems, toFeedItemRows } from "./feedCollector";

const NOW = new Date("2026-10-14T03:05:00.000Z");

const source = (
  id: string,
  category: RSSFeedCategory = "tech_blog"
): FeedSource => ({
  id,
  name: `${id} 이름`,
  rss_url: `https://${id}.example.com/feed.xml`,
  category,
});

const feed = (overrides: Partial<Feed> = {}): Feed => ({
  id: "https://example.com/a",
  url: "https://example.com/a",
  title: "제목",
  description: "설명",
  source: "출처",
  published_at: "Tue, 13 Oct 2026 09:00:00 +0900",
  category: "tech_blog",
  author: "작성자",
  interests: ["backend"],
  ...overrides,
});

describe("toFeedItemRows", () => {
  it("수집한 글을 저장 형식으로 바꾸고 발행 시각을 ISO로 맞춘다", () => {
    const rows = toFeedItemRows(
      [{ source: source("toss"), feeds: [feed()], ok: true }],
      NOW
    );

    expect(rows).toEqual([
      {
        id: "https://example.com/a",
        source_id: "toss",
        category: "tech_blog",
        title: "제목",
        description: "설명",
        image_url: null,
        author: "작성자",
        interests: ["backend"],
        published_at: "2026-10-13T00:00:00.000Z",
      },
    ]);
  });

  it("발행 시각을 읽을 수 없거나 비어 있는 글은 버린다", () => {
    const rows = toFeedItemRows(
      [
        {
          source: source("toss"),
          feeds: [
            feed({ id: "https://example.com/bad", published_at: "날짜 아님" }),
            // 수집 코드는 날짜가 없으면 1970-01-01을 넣는다.
            feed({
              id: "https://example.com/epoch",
              published_at: new Date(0).toISOString(),
            }),
            feed({ id: "https://example.com/ok" }),
          ],
          ok: true,
        },
      ],
      NOW
    );

    expect(rows.map(({ id }) => id)).toEqual(["https://example.com/ok"]);
  });

  it("수집 시각보다 미래인 발행 시각은 수집 시각으로 맞춘다", () => {
    const rows = toFeedItemRows(
      [
        {
          source: source("toss"),
          feeds: [feed({ published_at: "2026-10-20T00:00:00.000Z" })],
          ok: true,
        },
      ],
      NOW
    );

    expect(rows[0].published_at).toBe(NOW.toISOString());
  });

  it("카테고리를 넘어 같은 URL이면 먼저 나온 글 하나만 남긴다", () => {
    const rows = toFeedItemRows(
      [
        {
          source: source("geeknews", "it_news"),
          feeds: [feed({ category: "it_news", title: "먼저" })],
          ok: true,
        },
        {
          source: source("toss"),
          feeds: [feed({ title: "나중" })],
          ok: true,
        },
      ],
      NOW
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source_id: "geeknews",
      category: "it_news",
      title: "먼저",
    });
  });

  it("이미지 주소와 관심 분야가 없으면 null과 빈 배열로 둔다", () => {
    const rows = toFeedItemRows(
      [
        {
          source: source("toss"),
          feeds: [feed({ image_url: undefined, interests: undefined })],
          ok: true,
        },
      ],
      NOW
    );

    expect(rows[0].image_url).toBeNull();
    expect(rows[0].interests).toEqual([]);
  });
});

const rss = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel><title>테스트</title>${items}</channel></rss>`;

const item = (title: string, link: string) => `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link}</link>
  <pubDate>Tue, 13 Oct 2026 09:00:00 +0900</pubDate>
  <description><![CDATA[설명]]></description>
</item>`;

const xmlResponse = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { "content-type": "application/rss+xml" },
  });

describe("collectFeedItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    testState.getFeedSources.mockReset();
    testState.assertSafeRssUrl.mockReset();
    testState.assertSafeRssUrl.mockImplementation(
      async (value: string) => new URL(value)
    );
  });

  it("두 카테고리를 모두 수집하고 실패한 출처만 따로 알려 준다", async () => {
    testState.getFeedSources.mockImplementation((category: RSSFeedCategory) =>
      category === "it_news"
        ? [source("news", "it_news")]
        : [source("healthy"), source("broken")]
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = input.toString();
        if (url.includes("broken")) return xmlResponse("<rss><broken>");
        return xmlResponse(
          rss(
            item(
              url.includes("news") ? "뉴스" : "블로그",
              url.includes("news")
                ? "https://news.example.com/1?utm_source=rss"
                : "https://blog.example.com/1"
            )
          )
        );
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await collectFeedItems(NOW);

    expect(result.items.map(({ id, source_id }) => [id, source_id])).toEqual([
      ["https://news.example.com/1", "news"],
      ["https://blog.example.com/1", "healthy"],
    ]);
    expect(result.okCount).toBe(2);
    expect(result.failedSourceIds).toEqual(["broken"]);
  });
});
