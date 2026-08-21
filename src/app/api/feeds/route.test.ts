import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// #149에서 바꾼 분기만 덮는다. 전체 경로는 #151에서 다룬다.
describe("GET /api/feeds", () => {
  it("스크랩 피드 조회에 비로그인이면 규약 문구로 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=scraped"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("잘못된 카테고리는 의도한 검증 문구로 400을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=bogus"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효한 피드 카테고리가 필요합니다.",
    });
  });

  it("Supabase 오류 문구를 500 응답에 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        scraped_feeds: {
          error: {
            code: "42501",
            message: "permission denied for table scraped_feeds",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feeds?category=scraped"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "피드를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
