import { describe, expect, it } from "vitest";
import {
  getConfidenceLabel,
  getInterviewCategoryLabel,
} from "@/utils/interviewUtils";
import {
  INTERVIEW_CATEGORIES,
  isInterviewCategory,
  isReviewConfidence,
  REVIEW_CONFIDENCES,
} from "@/types/interview";

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
