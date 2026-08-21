import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, PUT } from "./route";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

// 서울 날짜와 스트릭 계산이 실행 시각에 의존하므로 고정한다.
const FIXED_NOW = new Date("2026-08-21T05:00:00.000Z");
const TODAY = "2026-08-21";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/daily-activities", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(
      getRequest(`/api/daily-activities?date=${TODAY}`)
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("날짜가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/daily-activities"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "날짜가 필요합니다." });
  });

  it("형식이 잘못된 날짜는 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/daily-activities?date=2026-8-21")
    );

    expect(response.status).toBe(400);
  });

  it("활동 기록이 없으면 사용자 목표를 기준으로 계산한다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        daily_activities: [{ data: null }, { data: [] }],
        users: { data: { daily_read_goal: 5 } },
        feed_reads: { count: 2 },
      },
    });
    installSupabaseMock(client);

    const response = await GET(
      getRequest(`/api/daily-activities?date=${TODAY}`)
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      user_id: "u1",
      date: TODAY,
      reading_goal: 5,
      read_count: 2,
      // 2 < 5 이므로 미달
      feed_clicked: false,
      reading_goal_completed: false,
      quiz_completed: false,
      cs_completed: false,
    });
  });

  it("활동 기록의 목표가 사용자 기본값보다 우선한다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        daily_activities: [
          {
            data: {
              reading_goal: 2,
              quiz_completed: true,
              cs_completed: true,
              reading_goal_completed: true,
            },
          },
          { data: [{ date: TODAY, reading_goal_completed: true }] },
        ],
        users: { data: { daily_read_goal: 10 } },
        feed_reads: { count: 3 },
      },
    });
    installSupabaseMock(client);

    const response = await GET(
      getRequest(`/api/daily-activities?date=${TODAY}`)
    );
    const body = await response.json();

    expect(body).toMatchObject({
      reading_goal: 2,
      read_count: 3,
      feed_clicked: true,
      quiz_completed: true,
      cs_completed: true,
      reading_goal_completed: true,
    });
    expect(body.current_streak).toBeGreaterThanOrEqual(1);
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        daily_activities: [{ data: null }, { data: [] }],
        users: {
          error: {
            code: "42501",
            message: "permission denied for table users",
          },
        },
        feed_reads: { count: 0 },
      },
    });
    installSupabaseMock(client);

    const response = await GET(
      getRequest(`/api/daily-activities?date=${TODAY}`)
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "일일 활동을 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("POST /api/daily-activities", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", { activity: "cs_completed" })
    );

    expect(response.status).toBe(401);
  });

  it("허용하지 않는 활동은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", { activity: "없는활동" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효하지 않은 활동입니다.",
    });
  });

  it("피드 정보를 함께 보내면 읽기 기록 rpc를 부른다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { daily_read_goal: 3 } },
        daily_activities: { data: { user_id: "u1" } },
      },
      rpc: { record_feed_read: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", {
        activity: "feed_clicked",
        feed: { id: "f1", title: "제목", url: "https://example.com" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fake.rpcCalls("record_feed_read")).toHaveLength(1);
    expect(fake.rpcCalls("record_feed_read")[0]).toMatchObject({
      p_feed_id: "f1",
      p_read_date: TODAY,
    });
  });

  it("피드 정보가 없으면 읽기 기록 rpc를 부르지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { daily_read_goal: 3 } },
        daily_activities: { data: { user_id: "u1" } },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", {
        activity: "feed_clicked",
      })
    );

    expect(response.status).toBe(200);
    expect(fake.rpcCalls("record_feed_read")).toEqual([]);
  });

  it("읽기 기록 rpc가 실패해도 활동 기록은 성공으로 응답한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { daily_read_goal: 3 } },
        daily_activities: { data: { user_id: "u1" } },
      },
      rpc: {
        record_feed_read: {
          error: { code: "42501", message: "permission denied" },
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", {
        activity: "feed_clicked",
        feed: { id: "f1", title: "제목", url: "https://example.com" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it("기록이 없으면 새로 만든다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: { daily_read_goal: 3 } },
        daily_activities: [{ data: null }, { data: null }],
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/daily-activities", {
        activity: "cs_completed",
      })
    );

    expect(response.status).toBe(200);
    const calls = fake.calls("daily_activities");
    expect(calls[0].op).toBe("update");
    expect(calls[1].op).toBe("insert");
    expect(calls[1].payload).toMatchObject({
      user_id: "u1",
      date: TODAY,
      cs_completed: true,
      quiz_completed: false,
      reading_goal: 3,
    });
  });
});

describe("PUT /api/daily-activities", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/daily-activities", { readingGoal: 5 })
    );

    expect(response.status).toBe(401);
  });

  it("범위를 벗어난 목표는 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    for (const readingGoal of [0, 21, "다섯"]) {
      const response = await PUT(
        jsonRequest("PUT", "/api/daily-activities", { readingGoal })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "읽기 목표는 1개 이상 20개 이하로 설정해야 합니다.",
      });
    }
  });

  it("목표를 바꾸고 달성 상태를 다시 계산한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: null },
        daily_activities: [{ data: { user_id: "u1" } }, { data: null }],
        feed_reads: { count: 4 },
      },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/daily-activities", { readingGoal: 3 })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ readingGoal: 3, date: TODAY });

    const calls = fake.calls("daily_activities");
    expect(calls).toHaveLength(2);
    // 읽은 글 4개가 목표 3개를 넘어 완료로 갱신된다.
    expect(calls[1].payload).toEqual({ reading_goal_completed: true });
  });

  it("행이 없으면 만들고, 동시 생성으로 충돌하면 갱신으로 되돌린다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: null },
        daily_activities: [
          { data: null },
          { error: { code: "23505", message: "duplicate key" } },
          { data: null },
          { data: null },
        ],
        feed_reads: { count: 0 },
      },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/daily-activities", { readingGoal: 7 })
    );

    expect(response.status).toBe(200);
    const ops = fake.calls("daily_activities").map((call) => call.op);
    expect(ops).toEqual(["update", "insert", "update", "update"]);
  });

  it("갱신 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: {
          error: {
            code: "42501",
            message: "permission denied for table users",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/daily-activities", { readingGoal: 5 })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "읽기 목표를 변경하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
