import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import { getFeedItemsPage } from "@/services/feedItemService";
import { encodeFeedCursor } from "@/utils/feedCursorUtils";
import type { Feed } from "@/types/feed";

vi.mock("@/utils/supabase/server");
// 정렬·커서 규칙은 feedItemService.test.ts에서 확인한다. 여기서는 route의 입력·출력만 본다.
vi.mock("@/services/feedItemService", () => ({
  getFeedItemsPage: vi.fn(),
}));

const rssService = vi.mocked(getFeedItemsPage);

const DENIED = {
  code: "42501",
  message: "permission denied for table scraped_feeds",
};

function feed(id: string): Feed {
  return {
    id,
    title: `제목 ${id}`,
    description: "설명",
    url: `https://example.com/${id}`,
    source: "예시 소스",
    published_at: "2026-08-21T00:00:00.000Z",
    category: "it_news",
  };
}

function rssResult(feedIds: string[], nextCursor: string | null = null) {
  return { feeds: feedIds.map(feed), nextCursor };
}

const VALID_CURSOR = encodeFeedCursor({
  v: 1,
  m: "d",
  t: "2026-10-13T00:00:00.000Z",
  id: "https://example.com/f1",
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  rssService.mockReset();
});

describe("GET /api/feeds 검증", () => {
  it("잘못된 카테고리는 의도한 검증 문구로 400을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=bogus"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효한 피드 카테고리가 필요합니다.",
    });
  });

  it("잘못된 관심 분야는 400을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/feeds?category=it_news&interest=없는분야")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효한 관심 분야가 필요합니다.",
    });
  });

  it("잘못된 스크랩 피드 유형은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/feeds?category=scraped&sourceCategory=bogus")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효한 스크랩 피드 유형이 필요합니다.",
    });
  });

  it("범위를 벗어난 limit은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=it_news&limit=51"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "limit은 1 이상 50 이하의 정수여야 합니다.",
    });
  });
});

describe("GET /api/feeds 커서 검증", () => {
  it.each([["not-a-cursor!"], ["a".repeat(5000)], [Buffer.from("{}").toString("base64url")]])(
    "잘못된 커서는 400을 주고 조회하지 않는다 (%s)",
    async (cursor) => {
      installSupabaseMock(fakeSupabase({ user: null }).client);

      const response = await GET(
        getRequest(`/api/feeds?category=tech_blog&cursor=${encodeURIComponent(cursor)}`)
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "유효하지 않은 커서입니다." });
      expect(rssService).not.toHaveBeenCalled();
    }
  );
});

describe("GET /api/feeds 검색어", () => {
  it.each([["a"], [" a "], ["가".repeat(51)]])(
    "검색어가 2자 미만이거나 50자를 넘으면 400 (%s)",
    async (q) => {
      installSupabaseMock(fakeSupabase({ user: null }).client);

      const response = await GET(
        getRequest(`/api/feeds?category=tech_blog&q=${encodeURIComponent(q)}`)
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "검색어는 2자 이상 50자 이하로 입력해 주세요.",
      });
      expect(rssService).not.toHaveBeenCalled();
    }
  );

  it("별표(*)는 와일드카드가 되므로 빼고 길이를 다시 검사한다", async () => {
    installSupabaseMock(fakeSupabase({ user: null }).client);

    const response = await GET(getRequest("/api/feeds?category=tech_blog&q=**"));

    expect(response.status).toBe(400);
    expect(rssService).not.toHaveBeenCalled();
  });

  it("별표를 뺀 검색어를 조회에 넘긴다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult([]));

    await GET(getRequest(`/api/feeds?category=tech_blog&q=${encodeURIComponent("리*액트*")}`));

    expect(rssService).toHaveBeenCalledWith(
      fake.client,
      expect.objectContaining({ query: "리액트" })
    );
  });

  it("앞뒤 공백을 뺀 검색어를 조회에 넘긴다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult([]));

    await GET(getRequest(`/api/feeds?category=tech_blog&q=${encodeURIComponent("  리액트 ")}`));

    expect(rssService).toHaveBeenCalledWith(
      fake.client,
      expect.objectContaining({ query: "리액트" })
    );
  });

  it("빈 검색어는 검색하지 않는다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult([]));

    await GET(getRequest("/api/feeds?category=tech_blog&q=%20%20"));

    expect(rssService).toHaveBeenCalledWith(
      fake.client,
      expect.objectContaining({ query: undefined })
    );
  });
});

describe("GET /api/feeds 스크랩 카테고리", () => {
  it("비로그인이면 규약 문구로 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=scraped"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("본인 스크랩만 페이지 범위대로 조회하고 is_scraped를 붙인다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        scraped_feeds: {
          data: [{ feed: { id: "f1", title: "제목" } }],
          count: 25,
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await GET(
      getRequest("/api/feeds?category=scraped&page=2&limit=12")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      feeds: [{ id: "f1", title: "제목", is_scraped: true }],
      totalCount: 25,
      totalPages: 3,
      currentPage: 2,
    });

    const call = fake.calls("scraped_feeds")[0];
    expect(call.filters).toEqual([["eq", "user_id", "u1"]]);
    expect(call.modifiers).toEqual([
      ["order", "created_at", { ascending: false }],
      ["range", 12, 23],
    ]);
    // 스크랩 목록은 RSS를 수집하지 않는다.
    expect(rssService).not.toHaveBeenCalled();
  });

  it("스크랩 유형 필터를 조건에 넣는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_feeds: { data: [], count: 0 } },
    });
    installSupabaseMock(fake.client);

    await GET(
      getRequest("/api/feeds?category=scraped&sourceCategory=tech_blog")
    );

    expect(fake.calls("scraped_feeds")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
      ["eq", "feed->>category", "tech_blog"],
    ]);
  });

  it("스크랩 조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_feeds: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=scraped"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "피드를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("GET /api/feeds RSS 카테고리", () => {
  it("비로그인이면 관심 분야 없이 조회하고 is_scraped를 모두 false로 준다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult(["f1", "f2"], VALID_CURSOR));

    const response = await GET(getRequest("/api/feeds?category=it_news"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      feeds: [
        { ...feed("f1"), is_scraped: false },
        { ...feed("f2"), is_scraped: false },
      ],
      nextCursor: VALID_CURSOR,
    });
    expect(rssService).toHaveBeenCalledWith(fake.client, {
      category: "it_news",
      limit: 12,
      cursor: undefined,
      interests: [],
      filterInterest: undefined,
      query: undefined,
      now: expect.any(Date),
    });
    // 비로그인은 스크랩 상태를 조회하지 않는다.
    expect(fake.calls("scraped_feeds")).toEqual([]);
  });

  it("로그인 사용자의 관심 분야와 커서를 조회에 전달하고 스크랩 상태를 병합한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { interests: ["frontend"] } },
        scraped_feeds: { data: [{ id: "f2" }] },
      },
    });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult(["f1", "f2"]));

    const response = await GET(
      getRequest(
        `/api/feeds?category=it_news&interest=frontend&limit=6&cursor=${VALID_CURSOR}`
      )
    );
    const body = await response.json();

    expect(rssService).toHaveBeenCalledWith(fake.client, {
      category: "it_news",
      limit: 6,
      cursor: VALID_CURSOR,
      interests: ["frontend"],
      filterInterest: "frontend",
      query: undefined,
      now: expect.any(Date),
    });
    expect(body.feeds).toEqual([
      { ...feed("f1"), is_scraped: false },
      { ...feed("f2"), is_scraped: true },
    ]);
    expect(fake.calls("scraped_feeds")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
      ["in", "feed->>id", ["f1", "f2"]],
    ]);
  });

  it("조회 결과가 없으면 스크랩 상태를 조회하지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: { interests: [] } } },
    });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult([]));

    const response = await GET(getRequest("/api/feeds?category=tech_blog"));

    expect(response.status).toBe(200);
    expect(fake.calls("scraped_feeds")).toEqual([]);
  });

  it("피드 조회 실패는 500을 주고 내부 문구를 담지 않는다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockRejectedValue(new Error("ETIMEDOUT https://example.com/rss"));

    const response = await GET(getRequest("/api/feeds?category=it_news"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "피드를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("ETIMEDOUT");
  });

  it("스크랩 상태 조회 실패는 500을 주고 내부 문구를 담지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { interests: [] } },
        scraped_feeds: { error: DENIED },
      },
    });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult(["f1"]));

    const response = await GET(getRequest("/api/feeds?category=it_news"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "피드를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
