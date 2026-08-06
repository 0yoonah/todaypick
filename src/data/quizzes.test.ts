import { describe, expect, it } from "vitest";
import { quizzes } from "@/data/quizzes";
import { getCategoryLabel } from "@/utils/quizUtils";
import type { QuizCategory } from "@/types/quiz";

const QUIZ_CATEGORIES: QuizCategory[] = [
  "programming",
  "database",
  "network",
  "security",
  "cloud",
  "algorithm",
  "web",
  "mobile",
  "devops",
  "general",
];

const MIN_QUIZZES = 40;
const MIN_PER_CATEGORY = 4;

/** v1.6.1까지 서비스한 문항 id. quiz_results 연결이 끊기지 않아야 한다. */
const LEGACY_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

describe("quizzes 데이터", () => {
  it(`문항이 ${MIN_QUIZZES}개 이상이다`, () => {
    expect(quizzes.length).toBeGreaterThanOrEqual(MIN_QUIZZES);
  });

  it("id가 중복되지 않는다", () => {
    const ids = quizzes.map((quiz) => quiz.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("기존 문항 id를 그대로 유지한다", () => {
    const ids = new Set(quizzes.map((quiz) => quiz.id));
    LEGACY_IDS.forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("정답 번호가 선택지 범위 안에 있다", () => {
    quizzes.forEach((quiz) => {
      expect(Number.isInteger(quiz.correct_answer)).toBe(true);
      expect(quiz.correct_answer).toBeGreaterThanOrEqual(0);
      expect(quiz.correct_answer).toBeLessThan(quiz.options.length);
    });
  });

  it("모든 문항이 4개의 서로 다른 선택지를 가진다", () => {
    quizzes.forEach((quiz) => {
      expect(quiz.options).toHaveLength(4);
      expect(new Set(quiz.options).size).toBe(quiz.options.length);
    });
  });

  it("질문과 해설이 비어 있지 않다", () => {
    quizzes.forEach((quiz) => {
      expect(quiz.question.trim().length).toBeGreaterThan(0);
      expect(quiz.explanation.trim().length).toBeGreaterThan(0);
    });
  });

  it("질문이 중복되지 않는다", () => {
    const questions = quizzes.map((quiz) => quiz.question.trim());
    expect(new Set(questions).size).toBe(questions.length);
  });

  it(`모든 카테고리에 문항이 ${MIN_PER_CATEGORY}개 이상 있다`, () => {
    const counts = quizzes.reduce<Record<string, number>>((acc, quiz) => {
      acc[quiz.category] = (acc[quiz.category] ?? 0) + 1;
      return acc;
    }, {});

    QUIZ_CATEGORIES.forEach((category) => {
      expect(counts[category] ?? 0).toBeGreaterThanOrEqual(MIN_PER_CATEGORY);
    });
  });

  it("정의되지 않은 카테고리를 사용하지 않는다", () => {
    quizzes.forEach((quiz) => {
      expect(QUIZ_CATEGORIES).toContain(quiz.category);
    });
  });

  it("모든 카테고리에 한글 라벨이 있다", () => {
    QUIZ_CATEGORIES.forEach((category) => {
      expect(getCategoryLabel(category)).not.toBe(category);
    });
  });

  it("created_at이 모듈 로드마다 달라지지 않는 고정 값이다", () => {
    quizzes.forEach((quiz) => {
      expect(quiz.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
    expect(new Set(quizzes.map((quiz) => quiz.created_at)).size).toBe(1);
  });
});
