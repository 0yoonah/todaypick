import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { quizzes } from "@/data/quizzes";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import { selectDailyQuiz } from "@/utils/quizUtils";

vi.mock("@/utils/supabase/server");

// 오늘의 퀴즈 선정이 서울 날짜에 따라 결정되므로 시각을 고정한다.
const FIXED_NOW = new Date("2026-08-21T05:00:00.000Z");
const TODAY = "2026-08-21";
const todayQuiz = selectDailyQuiz(quizzes, TODAY, [])!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/quizzes?scope=today", () => {
  it("비로그인 사용자에게도 오늘의 퀴즈를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes?scope=today"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.quiz.id).toBe(todayQuiz.id);
    expect(body).toMatchObject({
      result: null,
      isCompleted: false,
      solvedCount: 0,
      totalCount: quizzes.length,
    });
  });

  it("오늘 이미 푼 문제가 있으면 그 문제와 결과를 준다", async () => {
    const solved = quizzes[1];
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: [
            {
              quiz_id: solved.id,
              selected_answer: 0,
              is_correct: true,
              answered_at: FIXED_NOW.toISOString(),
            },
          ],
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes?scope=today"));
    const body = await response.json();

    expect(body.quiz.id).toBe(solved.id);
    expect(body.result).toMatchObject({ quiz_id: solved.id, is_correct: true });
    expect(body.solvedCount).toBe(1);
  });

  it("이미 푼 문제는 제외하고 다음 문제를 고른다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          // 어제 푼 기록이라 오늘의 결과는 아니다.
          data: [
            {
              quiz_id: todayQuiz.id,
              selected_answer: 0,
              is_correct: true,
              answered_at: "2026-08-20T05:00:00.000Z",
            },
          ],
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes?scope=today"));
    const body = await response.json();

    expect(body.result).toBeNull();
    expect(body.quiz.id).not.toBe(todayQuiz.id);
    expect(body.solvedCount).toBe(1);
  });

  it("모든 문제를 풀면 완주 상태를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: quizzes.map((quiz) => ({
            quiz_id: quiz.id,
            selected_answer: 0,
            is_correct: true,
            answered_at: "2026-08-20T05:00:00.000Z",
          })),
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes?scope=today"));
    const body = await response.json();

    expect(body.quiz).toBeNull();
    expect(body.isCompleted).toBe(true);
    expect(body.solvedCount).toBe(quizzes.length);
  });
});

describe("GET /api/quizzes", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("풀지 않은 문제를 단건 조회하면 null을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          error: { code: "PGRST116", message: "no rows returned" },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes?quizId=q1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  it("기록 목록에 퀴즈 정보를 붙여준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: [
            {
              quiz_id: todayQuiz.id,
              is_correct: true,
              answered_at: FIXED_NOW.toISOString(),
            },
            {
              quiz_id: "없는-퀴즈",
              is_correct: false,
              answered_at: FIXED_NOW.toISOString(),
            },
          ],
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes"));
    const body = await response.json();

    expect(body).toHaveLength(2);
    expect(body[0].quiz.id).toBe(todayQuiz.id);
    expect(body[1].quiz).toBeNull();
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          error: {
            code: "42501",
            message: "permission denied for table quiz_results",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/quizzes"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "퀴즈를 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("POST /api/quizzes", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", { selectedAnswer: 0 })
    );

    expect(response.status).toBe(401);
  });

  it("답안이 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(jsonRequest("POST", "/api/quizzes", {}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "선택한 답안이 필요합니다.",
    });
  });

  it("오늘 이미 제출했으면 409를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: [
            {
              quiz_id: todayQuiz.id,
              selected_answer: 0,
              is_correct: true,
              answered_at: FIXED_NOW.toISOString(),
            },
          ],
        },
      },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", { selectedAnswer: 1 })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "이미 답안을 제출한 퀴즈입니다.",
    });
  });

  it("모든 문제를 푼 상태면 404를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: {
          data: quizzes.map((quiz) => ({
            quiz_id: quiz.id,
            selected_answer: 0,
            is_correct: true,
            answered_at: "2026-08-20T05:00:00.000Z",
          })),
        },
      },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", { selectedAnswer: 0 })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "오늘 풀 수 있는 퀴즈가 없습니다.",
    });
  });

  it("정답을 저장하고 해설과 함께 응답한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: [{ data: [] }, { data: null }],
        daily_activities: { data: { user_id: "u1" } },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", {
        selectedAnswer: todayQuiz.correct_answer,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      isCorrect: true,
      explanation: todayQuiz.explanation,
    });

    const insert = fake.calls("quiz_results")[1];
    expect(insert.op).toBe("insert");
    expect(insert.payload).toMatchObject({
      user_id: "u1",
      quiz_id: todayQuiz.id,
      is_correct: true,
    });
  });

  it("오답도 저장하고 isCorrect를 false로 준다", async () => {
    const wrongAnswer = (todayQuiz.correct_answer + 1) % 4;
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: [{ data: [] }, { data: null }],
        daily_activities: { data: { user_id: "u1" } },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", { selectedAnswer: wrongAnswer })
    );

    expect((await response.json()).isCorrect).toBe(false);
  });

  it("활동 기록에 실패해도 답안 제출은 성공으로 응답한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        quiz_results: [{ data: [] }, { data: null }],
        daily_activities: {
          error: { code: "42501", message: "permission denied" },
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/quizzes", {
        selectedAnswer: todayQuiz.correct_answer,
      })
    );

    expect(response.status).toBe(200);
    expect((await response.json()).isCorrect).toBe(true);
  });
});
