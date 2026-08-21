import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "./route";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

// 히스토리 보관 기간이 서울 날짜 기준이라 시각을 고정한다.
const FIXED_NOW = new Date("2026-08-21T05:00:00.000Z");
const TODAY = "2026-08-21";
// 30일 보관이므로 오늘로부터 29일 전이 하한이다.
const CUTOFF = "2026-07-23";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/feed-reads", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feed-reads"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("잘못된 페이지 값은 의도한 검증 문구로 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feed-reads?page=0"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "page는 1 이상의 정수여야 합니다.",
    });
  });

  it("허용 범위를 넘는 limit은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feed-reads?limit=51"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "limit은 1 이상 50 이하의 정수여야 합니다.",
    });
  });

  it("보관 한도를 넘는 페이지는 조회 없이 빈 목록을 준다", async () => {
    const fake = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(fake.client);

    const response = await GET(getRequest("/api/feed-reads?page=10&limit=12"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      reads: [],
      totalCount: 100,
      totalPages: 9,
      currentPage: 10,
    });
    // 조회 자체를 하지 않는다.
    expect(fake.calls("feed_reads")).toEqual([]);
  });

  it("보관 기간 하한과 페이지 범위를 적용해 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        feed_reads: {
          data: [{ id: "r1", read_date: TODAY, read_count: 2 }],
          count: 30,
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await GET(getRequest("/api/feed-reads?page=2&limit=12"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      totalCount: 30,
      totalPages: 3,
      currentPage: 2,
    });
    expect(body.reads).toHaveLength(1);

    const call = fake.calls("feed_reads")[0];
    expect(call.filters).toEqual([
      ["eq", "user_id", "u1"],
      ["gte", "read_date", CUTOFF],
    ]);
    expect(call.modifiers).toEqual([
      ["order", "last_read_at", { ascending: false }],
      ["range", 12, 23],
    ]);
  });

  it("보관 한도를 넘는 총 개수는 한도로 잘라 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { feed_reads: { data: [], count: 250 } },
    });
    installSupabaseMock(client);

    const body = await (await GET(getRequest("/api/feed-reads"))).json();

    expect(body.totalCount).toBe(100);
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        feed_reads: {
          error: {
            code: "42501",
            message: "permission denied for table feed_reads",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/feed-reads"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "읽은 글 히스토리를 불러오지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("DELETE /api/feed-reads", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: ["r1"] })
    );

    expect(response.status).toBe(401);
  });

  it("빈 목록은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: [] })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "삭제할 기록을 1개 이상 50개 이하로 선택해야 합니다.",
    });
  });

  it("50개를 넘는 목록은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", {
        ids: Array.from({ length: 51 }, (_, index) => `r${index}`),
      })
    );

    expect(response.status).toBe(400);
  });

  it("중복 id는 하나로 합쳐 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { feed_reads: { data: [] } },
    });
    installSupabaseMock(fake.client);

    await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: ["r1", "r1", "r2"] })
    );

    expect(fake.calls("feed_reads")[0].filters).toEqual([
      ["in", "id", ["r1", "r2"]],
      ["eq", "user_id", "u1"],
    ]);
  });

  it("삭제할 대상이 없으면 아무것도 지우지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { feed_reads: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: ["없는id"] })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      deletedCount: 0,
      updatedDates: [],
    });
    expect(fake.calls("feed_reads")).toHaveLength(1);
  });

  it("삭제 후 해당 날짜의 목표 달성 상태를 다시 계산한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        feed_reads: [
          // 삭제 대상 조회
          { data: [{ id: "r1", read_date: TODAY }] },
          // 삭제
          { data: null },
          // 재계산용 남은 읽기 기록
          { data: [{ read_date: TODAY }] },
        ],
        users: { data: { daily_read_goal: 3 } },
        daily_activities: [
          // 달성으로 기록돼 있었지만 남은 읽기는 1개뿐이다.
          {
            data: [
              { date: TODAY, reading_goal: 3, reading_goal_completed: true },
            ],
          },
          { data: null },
        ],
      },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: ["r1"] })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      deletedCount: 1,
      updatedDates: [TODAY],
    });

    const deleteCall = fake.calls("feed_reads")[1];
    expect(deleteCall.op).toBe("delete");
    expect(deleteCall.filters).toEqual([
      ["in", "id", ["r1"]],
      ["eq", "user_id", "u1"],
    ]);

    const completionUpdate = fake.calls("daily_activities")[1];
    expect(completionUpdate.op).toBe("update");
    expect(completionUpdate.payload).toMatchObject({
      reading_goal_completed: false,
    });
  });

  it("삭제 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        feed_reads: {
          error: {
            code: "42501",
            message: "permission denied for table feed_reads",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await DELETE(
      jsonRequest("DELETE", "/api/feed-reads", { ids: ["r1"] })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "읽은 글 기록을 삭제하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
