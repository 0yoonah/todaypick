import { describe, expect, it } from "vitest";
import { calculateLearningStreaks } from "./streakUtils";

const learned = (date: string) => ({
  date,
  reading_goal_completed: true,
});

describe("calculateLearningStreaks", () => {
  it("오늘부터 이어지는 현재 연속 학습일을 계산한다", () => {
    expect(
      calculateLearningStreaks(
        [learned("2026-07-25"), learned("2026-07-26"), learned("2026-07-27")],
        "2026-07-27"
      )
    ).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("오늘 기록이 없어도 어제까지 이어졌으면 현재 streak을 유지한다", () => {
    expect(
      calculateLearningStreaks(
        [learned("2026-07-24"), learned("2026-07-25"), learned("2026-07-26")],
        "2026-07-27"
      )
    ).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("마지막 학습이 이틀 전이면 현재 streak은 0이다", () => {
    expect(
      calculateLearningStreaks(
        [learned("2026-07-20"), learned("2026-07-21"), learned("2026-07-25")],
        "2026-07-27"
      )
    ).toEqual({ currentStreak: 0, longestStreak: 2 });
  });

  it("활동이 없는 행과 중복 날짜를 제외한다", () => {
    expect(
      calculateLearningStreaks(
        [
          learned("2026-07-26"),
          { date: "2026-07-26", reading_goal_completed: true },
          { date: "2026-07-27" },
        ],
        "2026-07-27"
      )
    ).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it("목표를 달성하지 못한 활동일은 스트릭에서 제외한다", () => {
    expect(
      calculateLearningStreaks(
        [
          { date: "2026-07-25", feed_clicked: true },
          learned("2026-07-26"),
          learned("2026-07-27"),
        ],
        "2026-07-27"
      )
    ).toEqual({ currentStreak: 2, longestStreak: 2 });
  });

  it("월말과 연말 경계를 연속으로 계산한다", () => {
    expect(
      calculateLearningStreaks(
        [
          learned("2025-12-31"),
          learned("2026-01-01"),
          learned("2026-01-02"),
        ],
        "2026-01-02"
      )
    ).toEqual({ currentStreak: 3, longestStreak: 3 });
  });
});
