import { describe, expect, it } from "vitest";
import {
  filterInterviewQuestions,
  getConfidenceLabel,
  getInterviewCategoryLabel,
} from "@/utils/interviewUtils";
import type { InterviewQuestion } from "@/types/interview";
import {
  INTERVIEW_CATEGORIES,
  isInterviewCategory,
  isReviewConfidence,
  REVIEW_CONFIDENCES,
} from "@/types/interview";

const base: InterviewQuestion = {
  id: "base",
  question: "질문",
  answer: "답안",
  keywords: ["키워드"],
  category: "network",
  created_at: "2026-08-06T00:00:00.000Z",
};

describe("isInterviewCategory", () => {
  it("정의된 카테고리만 통과시킨다", () => {
    INTERVIEW_CATEGORIES.forEach((category) => {
      expect(isInterviewCategory(category)).toBe(true);
    });
    expect(isInterviewCategory("frontend")).toBe(false);
    expect(isInterviewCategory(null)).toBe(false);
    expect(isInterviewCategory(undefined)).toBe(false);
    expect(isInterviewCategory(1)).toBe(false);
  });
});

describe("isReviewConfidence", () => {
  it("정의된 평가 값만 통과시킨다", () => {
    REVIEW_CONFIDENCES.forEach((confidence) => {
      expect(isReviewConfidence(confidence)).toBe(true);
    });
    expect(isReviewConfidence("maybe")).toBe(false);
    expect(isReviewConfidence("")).toBe(false);
    expect(isReviewConfidence(null)).toBe(false);
  });
});

describe("라벨", () => {
  it("모든 카테고리에 한글 라벨이 있다", () => {
    INTERVIEW_CATEGORIES.forEach((category) => {
      const label = getInterviewCategoryLabel(category);
      expect(label).not.toBe(category);
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });

  it("모든 평가 값에 한글 라벨이 있다", () => {
    expect(getConfidenceLabel("explained")).toBe("설명했어요");
    expect(getConfidenceLabel("unsure")).toBe("애매해요");
    expect(getConfidenceLabel("unknown")).toBe("몰랐어요");
  });
});

describe("filterInterviewQuestions", () => {
  const questions = [
    { ...base, id: "a", category: "network" as const },
    { ...base, id: "b", category: "os" as const },
    { ...base, id: "c", category: "network" as const },
  ];

  it("분야를 고르지 않으면 전체를 반환한다", () => {
    expect(filterInterviewQuestions(questions)).toHaveLength(3);
    expect(filterInterviewQuestions(questions, undefined)).toBe(questions);
  });

  it("선택한 분야의 질문만 남긴다", () => {
    const filtered = filterInterviewQuestions(questions, "network");
    expect(filtered.map((question) => question.id)).toEqual(["a", "c"]);
  });

  it("해당 분야의 질문이 없으면 빈 배열을 반환한다", () => {
    expect(filterInterviewQuestions(questions, "system_design")).toEqual([]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    filterInterviewQuestions(questions, "network");
    expect(questions).toHaveLength(3);
  });
});
