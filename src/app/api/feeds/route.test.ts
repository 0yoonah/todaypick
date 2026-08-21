import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import { getRSSFeedsWithPagination } from "@/services/rssFeedService";
import type { Feed } from "@/types/feed";

vi.mock("@/utils/supabase/server");
// 외부 RSS를 실제로 받아오지 않는다. 테스트가 네트워크 상태에 의존하면 안 된다.
vi.mock("@/services/rssFeedService", () => ({
  getRSSFeedsWithPagination: vi.fn(),
}));

const rssService = vi.mocked(getRSSFeedsWithPagination);

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

function rssResult(feedIds: string[]) {
  return {
    feeds: feedIds.map(feed),
    totalCount: feedIds.length,
    totalPages: 1,
    currentPage: 1,
  };
}

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
  it("비로그인이면 관심 분야 없이 수집하고 is_scraped를 모두 false로 준다", async () => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);
    rssService.mockResolvedValue(rssResult(["f1", "f2"]));

    const response = await GET(getRequest("/api/feeds?category=it_news"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.feeds).toEqual([
      { ...feed("f1"), is_scraped: false },
      { ...feed("f2"), is_scraped: false },
    ]);
    expect(rssService).toHaveBeenCalledWith("it_news", 1, 12, [], undefined);
    // 비로그인은 스크랩 상태를 조회하지 않는다.
    expect(fake.calls("scraped_feeds")).toEqual([]);
  });

  it("로그인 사용자의 관심 분야를 수집에 전달하고 스크랩 상태를 병합한다", async () => {
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
      getRequest("/api/feeds?category=it_news&interest=frontend")
    );
    const body = await response.json();

    expect(rssService).toHaveBeenCalledWith(
      "it_news",
      1,
      12,
      ["frontend"],
      "frontend"
    );
    expect(body.feeds).toEqual([
      { ...feed("f1"), is_scraped: false },
      { ...feed("f2"), is_scraped: true },
    ]);
    expect(fake.calls("scraped_feeds")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
      ["in", "feed->>id", ["f1", "f2"]],
    ]);
  });

  it("수집 결과가 없으면 스크랩 상태를 조회하지 않는다", async () => {
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

  it("RSS 수집 실패는 500을 주고 내부 문구를 담지 않는다", async () => {
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
