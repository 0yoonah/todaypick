import { describe, expect, it } from "vitest";
import {
  LCP_PRIORITY_CARD_COUNT,
  shouldPrioritizeImage,
} from "@/utils/imagePriorityUtils";

describe("shouldPrioritizeImage", () => {
  it("첫 카드 이미지에만 우선순위를 준다", () => {
    expect(LCP_PRIORITY_CARD_COUNT).toBe(1);
    expect(shouldPrioritizeImage(0)).toBe(true);
    expect(shouldPrioritizeImage(1)).toBe(false);
    expect(shouldPrioritizeImage(11)).toBe(false);
  });

  it("첫 화면 목록이 아니면 지연 로딩을 유지한다", () => {
    expect(shouldPrioritizeImage(0, false)).toBe(false);
  });

  it("잘못된 순서 값은 우선순위를 주지 않는다", () => {
    expect(shouldPrioritizeImage(-1)).toBe(false);
  });
});
