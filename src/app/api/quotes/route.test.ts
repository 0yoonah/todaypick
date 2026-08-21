import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// #149에서 바꾼 분기만 덮는다. 전체 경로는 #151에서 다룬다.
describe("GET /api/quotes", () => {
  it("스크랩 여부를 객체로 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [{ id: "s1" }] } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isScraped: true });
  });

  it("스크랩 기록이 없으면 isScraped가 false다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        scraped_quotes: {
          error: { code: "PGRST116", message: "no rows returned" },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isScraped: false });
  });

  it("Supabase 오류 문구를 500 응답에 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        scraped_quotes: {
          error: {
            code: "42501",
            message: "permission denied for table scraped_quotes",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes?quoteId=q1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "명언을 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
