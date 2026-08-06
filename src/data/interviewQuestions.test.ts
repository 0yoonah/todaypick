import { describe, expect, it } from "vitest";
import { interviewQuestions } from "@/data/interviewQuestions";
import {
  getInterviewCategoryColor,
  getInterviewCategoryLabel,
} from "@/utils/interviewUtils";
import { INTERVIEW_CATEGORIES } from "@/types/interview";

const MIN_QUESTIONS = 70;
const MIN_PER_CATEGORY = 10;

describe("interviewQuestions 데이터", () => {
  it(`문항이 ${MIN_QUESTIONS}개 이상이다`, () => {
    expect(interviewQuestions.length).toBeGreaterThanOrEqual(MIN_QUESTIONS);
  });

  it("id가 중복되지 않는다", () => {
    const ids = interviewQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("질문과 답안이 비어 있지 않다", () => {
    interviewQuestions.forEach((question) => {
      expect(question.question.trim().length).toBeGreaterThan(0);
      expect(question.answer.trim().length).toBeGreaterThan(0);
    });
  });

  it("질문이 중복되지 않는다", () => {
    const questions = interviewQuestions.map((item) => item.question.trim());
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("모든 문항에 중복 없는 키워드가 1개 이상 있다", () => {
    interviewQuestions.forEach((question) => {
      expect(question.keywords.length).toBeGreaterThan(0);
      expect(new Set(question.keywords).size).toBe(question.keywords.length);
      question.keywords.forEach((keyword) => {
        expect(keyword.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it(`모든 카테고리에 문항이 ${MIN_PER_CATEGORY}개 이상 있다`, () => {
    const counts = interviewQuestions.reduce<Record<string, number>>(
      (acc, question) => {
        acc[question.category] = (acc[question.category] ?? 0) + 1;
        return acc;
      },
      {}
    );

    INTERVIEW_CATEGORIES.forEach((category) => {
      expect(counts[category] ?? 0).toBeGreaterThanOrEqual(MIN_PER_CATEGORY);
    });
  });

  it("정의되지 않은 카테고리를 사용하지 않는다", () => {
    interviewQuestions.forEach((question) => {
      expect(INTERVIEW_CATEGORIES).toContain(question.category);
    });
  });

  it("모든 카테고리에 한글 라벨과 색상이 있다", () => {
    INTERVIEW_CATEGORIES.forEach((category) => {
      expect(getInterviewCategoryLabel(category)).not.toBe(category);
      expect(getInterviewCategoryColor(category)).toContain("border-");
    });
  });

  it("created_at이 모듈 로드마다 달라지지 않는 고정 값이다", () => {
    interviewQuestions.forEach((question) => {
      expect(question.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
    expect(
      new Set(interviewQuestions.map((question) => question.created_at)).size
    ).toBe(1);
  });
});
