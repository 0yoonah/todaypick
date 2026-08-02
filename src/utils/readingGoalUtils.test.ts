import { describe, expect, it } from "vitest";
import {
  getReadingGoalProgress,
  isValidReadingGoal,
} from "./readingGoalUtils";

describe("readingGoalUtils", () => {
  it("1개부터 20개까지의 정수 목표만 허용한다", () => {
    expect(isValidReadingGoal(1)).toBe(true);
    expect(isValidReadingGoal(20)).toBe(true);
    expect(isValidReadingGoal(0)).toBe(false);
    expect(isValidReadingGoal(21)).toBe(false);
    expect(isValidReadingGoal(3.5)).toBe(false);
  });

  it("목표를 변경하면 같은 읽기 수로 진행률을 다시 계산한다", () => {
    const progress = getReadingGoalProgress(2, 3);
    expect(progress.isComplete).toBe(false);
    expect(progress.remaining).toBe(1);
    expect(progress.percentage).toBeCloseTo(200 / 3);
    expect(getReadingGoalProgress(2, 1)).toEqual({
      isComplete: true,
      remaining: 0,
      percentage: 100,
    });
  });

  it("목표를 초과해 읽어도 진행률은 100%를 넘지 않는다", () => {
    expect(getReadingGoalProgress(7, 5).percentage).toBe(100);
  });
});
