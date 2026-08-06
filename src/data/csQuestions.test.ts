import { describe, expect, it } from "vitest";
import { csQuestions } from "@/data/csQuestions";
import {
  getCsCategoryColor,
  getCsCategoryLabel,
} from "@/utils/csUtils";
import { CS_CATEGORIES } from "@/types/cs";

const MIN_QUESTIONS = 80;
const MIN_PER_CATEGORY = 10;

describe("csQuestions 데이터", () => {
  it(`문항이 ${MIN_QUESTIONS}개 이상이다`, () => {
    expect(csQuestions.length).toBeGreaterThanOrEqual(MIN_QUESTIONS);
  });

  it("id가 중복되지 않는다", () => {
    const ids = csQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("질문과 답안이 비어 있지 않다", () => {
    csQuestions.forEach((question) => {
      expect(question.question.trim().length).toBeGreaterThan(0);
      expect(question.answer.trim().length).toBeGreaterThan(0);
    });
  });

  it("질문이 중복되지 않는다", () => {
    const questions = csQuestions.map((item) => item.question.trim());
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("모든 문항에 중복 없는 키워드가 1개 이상 있다", () => {
    csQuestions.forEach((question) => {
      expect(question.keywords.length).toBeGreaterThan(0);
      expect(new Set(question.keywords).size).toBe(question.keywords.length);
      question.keywords.forEach((keyword) => {
        expect(keyword.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it(`모든 카테고리에 문항이 ${MIN_PER_CATEGORY}개 이상 있다`, () => {
    const counts = csQuestions.reduce<Record<string, number>>(
      (acc, question) => {
        acc[question.category] = (acc[question.category] ?? 0) + 1;
        return acc;
      },
      {}
    );

    CS_CATEGORIES.forEach((category) => {
      expect(counts[category] ?? 0).toBeGreaterThanOrEqual(MIN_PER_CATEGORY);
    });
  });

  it("정의되지 않은 카테고리를 사용하지 않는다", () => {
    csQuestions.forEach((question) => {
      expect(CS_CATEGORIES).toContain(question.category);
    });
  });

  it("모든 카테고리에 한글 라벨과 색상이 있다", () => {
    CS_CATEGORIES.forEach((category) => {
      expect(getCsCategoryLabel(category)).not.toBe(category);
      expect(getCsCategoryColor(category)).toContain("border-");
    });
  });

  it("created_at이 모듈 로드마다 달라지지 않는 고정 값이다", () => {
    csQuestions.forEach((question) => {
      expect(question.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
    expect(
      new Set(csQuestions.map((question) => question.created_at)).size
    ).toBe(1);
  });
});
