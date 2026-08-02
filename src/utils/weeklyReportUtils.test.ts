import { describe, expect, it } from "vitest";
import {
  compareWeeklyReports,
  createWeeklyReport,
} from "./weeklyReportUtils";

const dateKeys = [
  "2026-07-27",
  "2026-07-28",
  "2026-07-29",
  "2026-07-30",
  "2026-07-31",
  "2026-08-01",
  "2026-08-02",
];
const toDateKey = (value: string) => value.slice(0, 10);

describe("주간 학습 리포트", () => {
  it("기간 안의 학습일, 목표 완료일, 퀴즈 통계를 계산한다", () => {
    const report = createWeeklyReport(
      dateKeys,
      [
        {
          date: "2026-07-27",
          feed_clicked: true,
          quiz_completed: true,
          quote_viewed: true,
        },
        { date: "2026-07-28", feed_clicked: true },
        { date: "2026-07-20", feed_clicked: true },
      ],
      [
        { answered_at: "2026-07-27T10:00:00Z", is_correct: true },
        { answered_at: "2026-07-28T10:00:00Z", is_correct: false },
      ],
      [],
      toDateKey
    );

    expect(report.learningDays).toBe(2);
    expect(report.completedGoalDays).toBe(1);
    expect(report.quizzesCompleted).toBe(2);
    expect(report.accuracyRate).toBe(50);
  });

  it("읽기와 저장이 겹친 피드는 한 번만 집계하고 최다 분야를 계산한다", () => {
    const report = createWeeklyReport(
      dateKeys,
      [],
      [],
      [
        {
          feedId: "feed-1",
          date: "2026-07-27",
          interests: ["frontend"],
          kind: "read",
        },
        {
          feedId: "feed-1",
          date: "2026-07-28",
          interests: ["frontend"],
          kind: "scraped",
        },
        {
          feedId: "feed-2",
          date: "2026-07-28",
          interests: ["security"],
          kind: "read",
        },
      ],
      toDateKey
    );

    expect(report.feedReads).toBe(2);
    expect(report.feedsScraped).toBe(1);
    expect(report.feedsEngaged).toBe(2);
    expect(report.topInterest).toBe("frontend");
  });

  it("읽기 활동이 있어도 날짜별 읽기 목표를 채워야 완료일로 집계한다", () => {
    const report = createWeeklyReport(
      dateKeys,
      [
        {
          date: "2026-07-27",
          feed_clicked: true,
          quiz_completed: true,
          quote_viewed: true,
          readingGoalCompleted: false,
        },
      ],
      [],
      [],
      toDateKey
    );

    expect(report.learningDays).toBe(1);
    expect(report.completedGoalDays).toBe(0);
  });

  it("지난주 대비 증감을 계산한다", () => {
    const current = createWeeklyReport(dateKeys, [], [], [], toDateKey);
    const previous = {
      ...current,
      learningDays: 3,
      quizzesCompleted: 2,
      feedsEngaged: 4,
    };

    expect(compareWeeklyReports(current, previous)).toEqual({
      learningDays: -3,
      quizzesCompleted: -2,
      feedsEngaged: -4,
    });
  });
});
