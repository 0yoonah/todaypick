import { describe, expect, it } from "vitest";
import { hashDateKey, selectDailyQuiz } from "@/utils/quizUtils";
import { addDaysToDateKey } from "@/utils/dateUtils";
import type { Quiz } from "@/types/quiz";

const createQuiz = (id: string): Quiz => ({
  id,
  question: `질문 ${id}`,
  options: ["1", "2", "3", "4"],
  correct_answer: 0,
  explanation: "해설",
  category: "general",
  created_at: "2026-08-06T00:00:00.000Z",
});

const pool = Array.from({ length: 10 }, (_, index) =>
  createQuiz(String(index + 1))
);

describe("selectDailyQuiz", () => {
  it("같은 날짜에는 항상 같은 문제를 고른다", () => {
    const first = selectDailyQuiz(pool, "2026-08-06");
    const second = selectDailyQuiz(pool, "2026-08-06");

    expect(first).not.toBeNull();
    expect(first?.id).toBe(second?.id);
  });

  it("이미 푼 문제는 후보에서 제외한다", () => {
    const solved = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const quiz = selectDailyQuiz(pool, "2026-08-06", solved);

    expect(quiz?.id).toBe("10");
  });

  it("모든 문제를 풀었으면 null을 반환한다", () => {
    const solved = pool.map((quiz) => quiz.id);

    expect(selectDailyQuiz(pool, "2026-08-06", solved)).toBeNull();
  });

  it("문항이 없으면 null을 반환한다", () => {
    expect(selectDailyQuiz([], "2026-08-06")).toBeNull();
  });

  it("연속된 날짜에서 특정 문제로 치우치지 않는다", () => {
    const counts = new Map<string, number>();
    let dateKey = "2026-01-01";

    for (let day = 0; day < 100; day++) {
      const quiz = selectDailyQuiz(pool, dateKey);
      counts.set(quiz!.id, (counts.get(quiz!.id) ?? 0) + 1);
      dateKey = addDaysToDateKey(dateKey, 1);
    }

    // 10문항이 모두 한 번 이상 선택되고, 한 문항이 절반을 넘지 않는다.
    expect(counts.size).toBe(pool.length);
    expect(Math.max(...counts.values())).toBeLessThan(50);
  });

  it("날짜 끝자리가 같아도 다른 문제가 나올 수 있다", () => {
    const sameLastDigit = [
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
    ];
    const selected = new Set(
      sameLastDigit.map((dateKey) => selectDailyQuiz(pool, dateKey)?.id)
    );

    expect(selected.size).toBeGreaterThan(1);
  });

  it("월말과 연말 경계 날짜에서도 문제를 고른다", () => {
    ["2026-01-31", "2026-02-28", "2026-12-31", "2024-02-29"].forEach(
      (dateKey) => {
        expect(selectDailyQuiz(pool, dateKey)).not.toBeNull();
      }
    );
  });
});

describe("hashDateKey", () => {
  it("같은 날짜 키는 같은 값을 만든다", () => {
    expect(hashDateKey("2026-08-06")).toBe(hashDateKey("2026-08-06"));
  });

  it("다른 날짜 키는 다른 값을 만든다", () => {
    expect(hashDateKey("2026-08-06")).not.toBe(hashDateKey("2026-08-07"));
    expect(hashDateKey("2026-08-06")).not.toBe(hashDateKey("2026-09-06"));
  });

  it("항상 0 이상의 정수를 반환한다", () => {
    ["2026-01-01", "2026-12-31", "1999-06-15"].forEach((dateKey) => {
      const hash = hashDateKey(dateKey);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
    });
  });
});
