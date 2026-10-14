import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import type { FeedItemRow } from "@/services/feedCollector";

const testState = vi.hoisted(() => ({
  collectFeedItems: vi.fn(),
}));

vi.mock("@/utils/supabase/server");
vi.mock("@/services/feedCollector", () => ({
  collectFeedItems: testState.collectFeedItems,
}));

import { POST } from "./route";

const SECRET = "test-collector-secret";
const ROW: FeedItemRow = {
  id: "https://example.com/a",
  source_id: "toss",
  category: "tech_blog",
  title: "제목",
  description: "설명",
  image_url: null,
  author: "토스",
  interests: ["backend"],
  published_at: "2026-10-13T00:00:00.000Z",
};

const request = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/feeds/collect", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.stubEnv("FEED_COLLECTOR_SECRET", SECRET);
  vi.spyOn(console, "error").mockImplementation(() => {});
  testState.collectFeedItems.mockReset();
  testState.collectFeedItems.mockResolvedValue({
    items: [ROW],
    okCount: 29,
    failedSourceIds: ["broken"],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/feeds/collect", () => {
  it("수집 비밀값 환경 변수가 없으면 500이고 수집하지 않는다", async () => {
    vi.stubEnv("FEED_COLLECTOR_SECRET", "");
    installSupabaseMock(fakeSupabase({}).client);

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "수집 설정이 없습니다." });
    expect(testState.collectFeedItems).not.toHaveBeenCalled();
  });

  it.each([
    [undefined],
    ["Bearer wrong-secret"],
    [SECRET],
    [`Basic ${SECRET}`],
  ])("비밀값이 맞지 않으면 401이고 수집하지 않는다 (%s)", async (header) => {
    installSupabaseMock(fakeSupabase({}).client);

    const response = await POST(request(header));

    expect(response.status).toBe(401);
    expect(testState.collectFeedItems).not.toHaveBeenCalled();
  });

  it("수집한 글을 비밀값과 함께 upsert_feed_items로 넘기고 결과를 돌려준다", async () => {
    const fake = fakeSupabase({
      rpc: { upsert_feed_items: { data: { upserted: 1, deleted: 0 } } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      upserted: 1,
      deleted: 0,
      sources: { ok: 29, failed: ["broken"] },
    });
    expect(fake.rpcCalls("upsert_feed_items")).toEqual([
      { p_secret: SECRET, p_items: [ROW] },
    ]);
  });

  it("저장에 실패하면 500이고 원본 오류를 응답에 담지 않는다", async () => {
    installSupabaseMock(
      fakeSupabase({
        rpc: {
          upsert_feed_items: {
            error: { code: "42501", message: "invalid collector secret" },
          },
        },
      }).client
    );

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "수집한 글을 저장하지 못했습니다.",
    });
  });

  it("수집 중 예외가 나면 500", async () => {
    installSupabaseMock(fakeSupabase({}).client);
    testState.collectFeedItems.mockRejectedValue(new Error("boom"));

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "수집한 글을 저장하지 못했습니다.",
    });
  });
});
