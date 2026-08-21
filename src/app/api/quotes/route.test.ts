import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const NO_ROWS = { code: "PGRST116", message: "no rows returned" };
const DENIED = {
  code: "42501",
  message: "permission denied for table scraped_quotes",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/quotes", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("스크랩 여부를 객체로 준다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [{ id: "s1" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await GET(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isScraped: true });
    expect(fake.calls("scraped_quotes")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
      ["eq", "quote->>id", "q1"],
    ]);
  });

  it("스크랩 기록이 없으면 isScraped가 false다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isScraped: false });
  });

  it("quoteId가 없으면 스크랩한 명언 목록을 최신순으로 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [{ id: "s1" }, { id: "s2" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await GET(getRequest("/api/quotes"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "s1" }, { id: "s2" }]);
    expect(fake.calls("scraped_quotes")[0].modifiers).toEqual([
      ["order", "created_at", { ascending: false }],
    ]);
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quotes"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "명언을 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("POST /api/quotes", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quotes", { quote: { id: "q1" } })
    );

    expect(response.status).toBe(401);
  });

  it("명언 정보가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(jsonRequest("POST", "/api/quotes", {}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "명언 정보가 필요합니다." });
  });

  it("이미 스크랩한 명언은 409를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [{ id: "s1" }] } },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quotes", { quote: { id: "q1" } })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "이미 스크랩한 명언입니다.",
    });
  });

  it("스크랩을 저장하고 저장된 행을 준다", async () => {
    const saved = { id: "s1", quote: { id: "q1", text: "명언" } };
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        scraped_quotes: [
          // 중복 확인: 기록 없음
          { error: NO_ROWS },
          // 저장
          { data: [saved] },
        ],
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/quotes", {
        quote: { id: "q1", text: "명언" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(saved);

    const insert = fake.calls("scraped_quotes")[1];
    expect(insert.op).toBe("insert");
    expect(insert.payload).toEqual({
      user_id: "u1",
      quote: { id: "q1", text: "명언" },
    });
  });

  it("저장 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: [{ error: NO_ROWS }, { error: DENIED }] },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quotes", { quote: { id: "q1" } })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "명언 스크랩에 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("DELETE /api/quotes", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(401);
  });

  it("quoteId가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/quotes"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "quoteId가 필요합니다." });
  });

  it("스크랩 기록이 없으면 404를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [] } },
    });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "스크랩한 명언을 찾을 수 없습니다.",
    });
  });

  it("본인 기록만 대상으로 스크랩을 해제한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { data: [{ id: "s1" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(getRequest("/api/quotes?quoteId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });

    const call = fake.calls("scraped_quotes")[0];
    expect(call.op).toBe("delete");
    expect(call.filters).toEqual([
      ["eq", "user_id", "u1"],
      ["eq", "quote->>id", "q1"],
    ]);
  });

  it("해제 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { scraped_quotes: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/quotes?quoteId=q1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "명언 스크랩 해제에 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
