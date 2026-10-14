import { describe, expect, it } from "vitest";
import {
  EAGER_IMAGE_CARD_COUNT,
  LCP_PRIORITY_CARD_COUNT,
  shouldLoadImageEagerly,
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

describe("shouldLoadImageEagerly", () => {
  it("데스크톱 첫 줄(앞 3장)까지는 지연 로딩하지 않는다", () => {
    expect(EAGER_IMAGE_CARD_COUNT).toBe(3);
    expect(shouldLoadImageEagerly(0)).toBe(true);
    expect(shouldLoadImageEagerly(2)).toBe(true);
    expect(shouldLoadImageEagerly(3)).toBe(false);
  });

  it("첫 화면 목록이 아니거나 잘못된 순서면 지연 로딩을 유지한다", () => {
    expect(shouldLoadImageEagerly(0, false)).toBe(false);
    expect(shouldLoadImageEagerly(-1)).toBe(false);
  });
});
