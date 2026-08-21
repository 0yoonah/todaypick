import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { csQuestions } from "@/data/csQuestions";
import { jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import { gradeCsAnswer, MAX_CS_ANSWER_LENGTH } from "@/utils/csUtils";

vi.mock("@/utils/supabase/server");

const question = csQuestions[0];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/cs-reviews", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: {
        cs_reviews: {
          error: {
            code: "42501",
            message: "permission denied for table cs_reviews",
          },
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "채점 기록을 불러오지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("본인 기록만 조회하고 복습 목록과 진도를 함께 준다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        cs_reviews: {
          data: [
            {
              question_id: question.id,
              score: 40,
              matched_keywords: [],
              answer: "짧은 답",
              reviewed_at: "2026-08-20T00:00:00.000Z",
            },
          ],
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviews).toHaveLength(1);
    // 60점 미만이라 복습 대상에 들어간다.
    expect(body.reviewQuestions.map((item: { id: string }) => item.id)).toContain(
      question.id
    );
    expect(body.progress).toBeDefined();
    expect(body.keywordLinks).toBeDefined();
    expect(fake.calls("cs_reviews")).toEqual([
      {
        op: "select",
        columns: "question_id, score, matched_keywords, answer, reviewed_at",
        filters: [["eq", "user_id", "u1"]],
        modifiers: [],
        terminal: "await",
      },
    ]);
  });
});

describe("POST /api/cs-reviews", () => {
  const savedReview = {
    question_id: question.id,
    score: 100,
    matched_keywords: question.keywords,
    answer: "답",
    reviewed_at: "2026-08-21T00:00:00.000Z",
  };

  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: question.id,
        answer: "답",
      })
    );

    expect(response.status).toBe(401);
  });

  it("존재하지 않는 질문은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: "없는-질문",
        answer: "답",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "존재하지 않는 질문입니다.",
    });
  });

  it("빈 답변은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: question.id,
        answer: "   ",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "답변을 입력해야 합니다." });
  });

  it("최대 길이를 넘는 답변은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: question.id,
        answer: "가".repeat(MAX_CS_ANSWER_LENGTH + 1),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: `답변은 ${MAX_CS_ANSWER_LENGTH}자 이하로 작성해야 합니다.`,
    });
  });

  it("클라이언트가 보낸 점수를 믿지 않고 서버에서 다시 채점한다", async () => {
    const answer = question.keywords.join(" ");
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        cs_reviews: { data: [savedReview] },
        daily_activities: { data: { user_id: "u1" } },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: question.id,
        answer,
        score: 0,
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ review: savedReview });

    const expected = gradeCsAnswer(answer, question.keywords);
    const payload = fake.calls("cs_reviews")[0].payload as {
      score: number;
      user_id: string;
    };
    expect(payload.score).toBe(expected.score);
    expect(payload.score).not.toBe(0);
    expect(payload.user_id).toBe("u1");
  });

  it("일일 활동 기록에 실패해도 채점 저장은 성공으로 응답한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        cs_reviews: { data: [savedReview] },
        daily_activities: {
          error: { code: "42501", message: "permission denied" },
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/cs-reviews", {
        question_id: question.id,
        answer: "답변",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ review: savedReview });
    expect(fake.calls("daily_activities")).toHaveLength(1);
  });
});
