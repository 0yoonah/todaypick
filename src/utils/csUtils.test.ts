import { describe, expect, it } from "vitest";
import {
  CS_PASS_SCORE,
  filterCsQuestions,
  getCsCategoryLabel,
  getScoreFeedback,
  gradeCsAnswer,
  needsReview,
  normalizeAnswerText,
  restoreGradeResult,
  selectReviewQuestions,
  toReviewMap,
} from "@/utils/csUtils";
import type { CsQuestion, CsReview } from "@/types/cs";
import { CS_CATEGORIES, isCsCategory } from "@/types/cs";

const base: CsQuestion = {
  id: "base",
  question: "질문",
  answer: "답안",
  keywords: ["키워드"],
  category: "network",
  created_at: "2026-08-06T00:00:00.000Z",
};

describe("isCsCategory", () => {
  it("정의된 카테고리만 통과시킨다", () => {
    CS_CATEGORIES.forEach((category) => {
      expect(isCsCategory(category)).toBe(true);
    });
    expect(isCsCategory("web")).toBe(false);
    expect(isCsCategory("language")).toBe(false);
    expect(isCsCategory(null)).toBe(false);
    expect(isCsCategory(undefined)).toBe(false);
    expect(isCsCategory(1)).toBe(false);
  });
});

describe("라벨", () => {
  it("모든 카테고리에 한글 라벨이 있다", () => {
    CS_CATEGORIES.forEach((category) => {
      const label = getCsCategoryLabel(category);
      expect(label).not.toBe(category);
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });
});

describe("filterCsQuestions", () => {
  const questions = [
    { ...base, id: "a", category: "network" as const },
    { ...base, id: "b", category: "os" as const },
    { ...base, id: "c", category: "network" as const },
  ];

  it("분야를 고르지 않으면 전체를 반환한다", () => {
    expect(filterCsQuestions(questions)).toHaveLength(3);
    expect(filterCsQuestions(questions, undefined)).toBe(questions);
  });

  it("선택한 분야의 질문만 남긴다", () => {
    const filtered = filterCsQuestions(questions, "network");
    expect(filtered.map((question) => question.id)).toEqual(["a", "c"]);
  });

  it("해당 분야의 질문이 없으면 빈 배열을 반환한다", () => {
    expect(filterCsQuestions(questions, "system_design")).toEqual([]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    filterCsQuestions(questions, "network");
    expect(questions).toHaveLength(3);
  });
});

describe("normalizeAnswerText", () => {
  it("공백과 구분 기호를 없애고 소문자로 맞춘다", () => {
    expect(normalizeAnswerText("연결 지향")).toBe("연결지향");
    expect(normalizeAnswerText("TCP")).toBe("tcp");
    expect(normalizeAnswerText("AI·데이터")).toBe("ai데이터");
    expect(normalizeAnswerText("in-memory (cache)")).toBe("inmemorycache");
  });
});

describe("gradeCsAnswer", () => {
  const keywords = ["연결 지향", "신뢰성", "순서 보장", "재전송"];

  it("언급한 키워드 비율로 점수를 계산한다", () => {
    const result = gradeCsAnswer("연결 지향이고 신뢰성을 보장합니다", keywords);

    expect(result.matched).toEqual(["연결 지향", "신뢰성"]);
    expect(result.missed).toEqual(["순서 보장", "재전송"]);
    expect(result.total).toBe(4);
    expect(result.score).toBe(50);
  });

  it("붙여 쓰거나 조사가 끼어도 인식한다", () => {
    const result = gradeCsAnswer(
      "연결지향적이고 순서를 보장하며 재전송한다",
      keywords
    );

    expect(result.matched).toContain("연결 지향");
    expect(result.matched).toContain("순서 보장");
    expect(result.matched).toContain("재전송");
  });

  it("구성 단어가 모두 나오면 순서가 달라도 인식한다", () => {
    expect(gradeCsAnswer("보장한다, 순서를", ["순서 보장"]).score).toBe(100);
  });

  it("한 단어짜리 키워드는 부분 문자열로만 인식한다", () => {
    expect(gradeCsAnswer("재전", ["재전송"]).score).toBe(0);
  });

  it("대소문자를 구분하지 않는다", () => {
    expect(gradeCsAnswer("tcp를 씁니다", ["TCP"]).score).toBe(100);
  });

  it("모두 언급하면 100점, 하나도 없으면 0점이다", () => {
    expect(gradeCsAnswer(keywords.join(" "), keywords).score).toBe(100);
    expect(gradeCsAnswer("모르겠습니다", keywords).score).toBe(0);
  });

  it("빈 답변은 0점이다", () => {
    const result = gradeCsAnswer("", keywords);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missed).toHaveLength(4);
  });

  it("키워드가 없으면 0점을 반환하고 오류를 내지 않는다", () => {
    expect(gradeCsAnswer("답변", [])).toEqual({
      score: 0,
      matched: [],
      missed: [],
      total: 0,
    });
  });

  it("점수를 정수로 반올림한다", () => {
    const three = ["가", "나", "다"];
    expect(gradeCsAnswer("가", three).score).toBe(33);
    expect(gradeCsAnswer("가 나", three).score).toBe(67);
  });
});

describe("needsReview / getScoreFeedback", () => {
  it("기준 점수 미만이면 복습 대상이다", () => {
    expect(needsReview(CS_PASS_SCORE - 1)).toBe(true);
    expect(needsReview(CS_PASS_SCORE)).toBe(false);
    expect(needsReview(100)).toBe(false);
  });

  it("점수 구간에 따라 다른 안내를 준다", () => {
    const high = getScoreFeedback(80);
    const mid = getScoreFeedback(CS_PASS_SCORE);
    const low = getScoreFeedback(CS_PASS_SCORE - 1);

    expect(new Set([high, mid, low]).size).toBe(3);
    expect(high.length).toBeGreaterThan(0);
  });
});

describe("restoreGradeResult", () => {
  const keywords = ["가", "나", "다", "라"];

  it("저장된 기록으로 화면 표시용 결과를 복원한다", () => {
    const result = restoreGradeResult(keywords, ["나", "라"], 50);

    expect(result.matched).toEqual(["나", "라"]);
    expect(result.missed).toEqual(["가", "다"]);
    expect(result.total).toBe(4);
    expect(result.score).toBe(50);
  });

  it("문항의 키워드 순서를 유지한다", () => {
    expect(restoreGradeResult(keywords, ["라", "가"], 50).matched).toEqual([
      "가",
      "라",
    ]);
  });

  it("문항에 없는 키워드가 기록에 남아 있어도 무시한다", () => {
    const result = restoreGradeResult(keywords, ["나", "삭제된키워드"], 25);

    expect(result.matched).toEqual(["나"]);
    expect(result.missed).toHaveLength(3);
  });

  it("언급 기록이 없으면 전부 놓친 것으로 본다", () => {
    const result = restoreGradeResult(keywords, [], 0);
    expect(result.matched).toEqual([]);
    expect(result.missed).toEqual(keywords);
  });
});

describe("toReviewMap", () => {
  const review = (question_id: string, score: number): CsReview => ({
    question_id,
    score,
    matched_keywords: [],
    answer: "",
    used_hint: false,
    reviewed_at: "2026-08-06T00:00:00.000Z",
  });

  it("질문 id로 기록을 찾을 수 있다", () => {
    const map = toReviewMap([review("net-1", 80), review("os-1", 40)]);

    expect(map.get("net-1")?.score).toBe(80);
    expect(map.get("os-1")?.score).toBe(40);
    expect(map.get("db-1")).toBeUndefined();
  });

  it("기록이 없으면 빈 맵을 반환한다", () => {
    expect(toReviewMap([]).size).toBe(0);
  });
});

describe("selectReviewQuestions", () => {
  const question = (id: string): CsQuestion => ({ ...base, id });
  const questions = ["a", "b", "c", "d"].map(question);
  const record = (
    question_id: string,
    score: number,
    reviewed_at: string
  ): CsReview => ({
    question_id,
    score,
    matched_keywords: [],
    answer: "답변",
    used_hint: false,
    reviewed_at,
  });

  it("기준 점수 미만인 질문만 남긴다", () => {
    const reviews = toReviewMap([
      record("a", 100, "2026-08-01T00:00:00.000Z"),
      record("b", CS_PASS_SCORE, "2026-08-01T00:00:00.000Z"),
      record("c", CS_PASS_SCORE - 1, "2026-08-01T00:00:00.000Z"),
    ]);

    expect(selectReviewQuestions(questions, reviews).map((q) => q.id)).toEqual([
      "c",
    ]);
  });

  it("점수가 낮은 질문을 먼저 보여준다", () => {
    const reviews = toReviewMap([
      record("a", 50, "2026-08-01T00:00:00.000Z"),
      record("b", 0, "2026-08-01T00:00:00.000Z"),
      record("c", 25, "2026-08-01T00:00:00.000Z"),
    ]);

    expect(selectReviewQuestions(questions, reviews).map((q) => q.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("점수가 같으면 오래전에 푼 질문을 먼저 보여준다", () => {
    const reviews = toReviewMap([
      record("a", 20, "2026-08-05T00:00:00.000Z"),
      record("b", 20, "2026-08-01T00:00:00.000Z"),
      record("c", 20, "2026-08-03T00:00:00.000Z"),
    ]);

    expect(selectReviewQuestions(questions, reviews).map((q) => q.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("점수와 시각이 모두 같으면 질문 id로 순서를 고정한다", () => {
    const same = "2026-08-01T00:00:00.000Z";
    const reviews = toReviewMap([
      record("c", 30, same),
      record("a", 30, same),
      record("b", 30, same),
    ]);

    const ordered = selectReviewQuestions(questions, reviews).map((q) => q.id);
    expect(ordered).toEqual(["a", "b", "c"]);
    expect(
      selectReviewQuestions([...questions].reverse(), reviews).map((q) => q.id)
    ).toEqual(ordered);
  });

  it("풀지 않은 질문은 복습 대상이 아니다", () => {
    expect(selectReviewQuestions(questions, toReviewMap([]))).toEqual([]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const reviews = toReviewMap([
      record("d", 10, "2026-08-01T00:00:00.000Z"),
      record("a", 20, "2026-08-01T00:00:00.000Z"),
    ]);
    selectReviewQuestions(questions, reviews);
    expect(questions.map((q) => q.id)).toEqual(["a", "b", "c", "d"]);
  });
});
