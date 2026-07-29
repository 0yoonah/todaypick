import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  getCurrentWeekDateKeys,
  getWeekDateKeys,
  getSeoulDateKey,
  isValidDateKey,
} from "./dateUtils";

describe("서울 기준 날짜", () => {
  it("UTC 날짜가 아직 전날이어도 서울 자정 이후 날짜를 반환한다", () => {
    expect(getSeoulDateKey(new Date("2026-07-26T15:30:00.000Z"))).toBe(
      "2026-07-27"
    );
  });

  it("서울 자정 직전에는 이전 날짜를 반환한다", () => {
    expect(getSeoulDateKey(new Date("2026-07-26T14:59:59.999Z"))).toBe(
      "2026-07-26"
    );
  });

  it("월말과 연말을 넘겨 날짜를 더할 수 있다", () => {
    expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("서울 기준 현재 주의 월요일부터 일요일을 반환한다", () => {
    expect(
      getCurrentWeekDateKeys(new Date("2026-07-26T15:30:00.000Z"))
    ).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("지난주 날짜 범위를 월요일부터 일요일까지 반환한다", () => {
    expect(getWeekDateKeys(new Date("2026-07-29T03:00:00.000Z"), -1)).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
  });

  it("유효한 날짜 키만 허용한다", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-2-8")).toBe(false);
  });
});
