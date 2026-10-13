import { describe, expect, it } from "vitest";
import { POLICY_EFFECTIVE_DATE, formatPolicyDate } from "./policy";

describe("policy", () => {
  it("시행일은 YYYY-MM-DD 형식이다", () => {
    expect(POLICY_EFFECTIVE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("표시용 날짜를 만든다", () => {
    expect(formatPolicyDate("2026-10-13")).toBe("2026년 10월 13일");
    expect(formatPolicyDate("2027-01-05")).toBe("2027년 1월 5일");
  });

  it("인자가 없으면 현재 시행일을 쓴다", () => {
    expect(formatPolicyDate()).toBe(formatPolicyDate(POLICY_EFFECTIVE_DATE));
  });
});
