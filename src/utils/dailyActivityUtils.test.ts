import { describe, expect, it } from "vitest";
import {
  EMPTY_DAILY_ACTIVITY,
  getCompletedActivityCount,
} from "./dailyActivityUtils";

describe("오늘의 학습 체크리스트", () => {
  it("활동 데이터가 없으면 완료 개수는 0이다", () => {
    expect(getCompletedActivityCount(null)).toBe(0);
  });

  it("완료한 활동의 개수를 계산한다", () => {
    expect(
      getCompletedActivityCount({
        ...EMPTY_DAILY_ACTIVITY,
        feed_clicked: true,
        cs_completed: true,
      })
    ).toBe(2);
  });

  it("체크리스트 활동이 모두 완료되면 완료 개수는 3이다", () => {
    expect(
      getCompletedActivityCount({
        feed_clicked: true,
        quiz_completed: true,
        quote_viewed: false,
        cs_completed: true,
      })
    ).toBe(3);
  });

  it("명언 확인은 체크리스트에서 빠져 완료 개수에 세지 않는다", () => {
    expect(
      getCompletedActivityCount({
        ...EMPTY_DAILY_ACTIVITY,
        quote_viewed: true,
      })
    ).toBe(0);
  });
});
