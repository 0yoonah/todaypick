import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

// 주간 집계가 실행 시각에 따라 달라지므로 서울 기준 날짜를 고정한다.
// 2026-08-21T05:00:00Z = 서울 2026-08-21 14:00 (금요일), 이번 주는 08-17~08-23.
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

describe("GET /api/statistics", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("조회 중 하나라도 실패하면 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: { data: [] },
        scraped_feeds: { data: [] },
        scraped_quotes: { data: [] },
        daily_activities: {
          error: {
            code: "42501",
            message: "permission denied for table daily_activities",
          },
        },
        feed_reads: { data: [] },
      },
    });
    installSupabaseMock(client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "통계를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("누적 통계와 이번 주 집계를 계산한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: [
            { is_correct: true, answered_at: FIXED_NOW.toISOString() },
            { is_correct: true, answered_at: FIXED_NOW.toISOString() },
            { is_correct: false, answered_at: FIXED_NOW.toISOString() },
          ],
        },
        scraped_feeds: {
          data: [
            { id: "f1", feed: { id: "f1" }, created_at: FIXED_NOW.toISOString() },
          ],
        },
        scraped_quotes: {
          data: [{ id: "q1", created_at: FIXED_NOW.toISOString() }],
        },
        daily_activities: {
          data: [
            {
              date: TODAY,
              quiz_completed: true,
              cs_completed: false,
              reading_goal: 3,
              reading_goal_completed: false,
            },
          ],
        },
        feed_reads: {
          data: [
            {
              feed_id: "r1",
              feed: { interests: [] },
              read_date: TODAY,
              read_at: FIXED_NOW.toISOString(),
            },
          ],
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      totalQuizzes: 3,
      correctQuizzes: 2,
      accuracyRate: 66.67,
      totalScrapedFeeds: 1,
      totalScrapedQuotes: 1,
    });

    expect(body.weeklyStatistics).toHaveLength(7);
    const today = body.weeklyStatistics.find(
      (day: { date: string }) => day.date === TODAY
    );
    expect(today).toMatchObject({
      quizzesCompleted: 3,
      feedsScraped: 1,
      quotesViewed: 1,
      dailyProgress: {
        // 읽은 글 1개는 목표 3개에 못 미친다.
        feedClick: false,
        quizComplete: true,
        csComplete: false,
      },
    });

    expect(body.weeklyReport.current).toBeDefined();
    expect(body.weeklyReport.previous).toBeDefined();
    expect(body.weeklyReport.comparison).toBeDefined();
  });

  it("본인 데이터만 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: { data: [] },
        scraped_feeds: { data: [] },
        scraped_quotes: { data: [] },
        daily_activities: { data: [] },
        feed_reads: { data: [] },
      },
    });
    installSupabaseMock(fake.client);

    await GET();

    for (const table of [
      "quiz_results",
      "scraped_feeds",
      "scraped_quotes",
      "daily_activities",
      "feed_reads",
    ]) {
      expect(fake.calls(table)[0].filters).toEqual([["eq", "user_id", "u1"]]);
    }
  });
});
