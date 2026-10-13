import { describe, expect, it } from "vitest";
import { LEGACY_DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import { INTERESTS } from "@/config/interests";
import {
  PLACEHOLDER_TONES,
  getFeedPlaceholderTone,
  getPlaceholderTone,
  hasDisplayableImage,
} from "./thumbnailUtils";

describe("getPlaceholderTone", () => {
  it("같은 값에는 항상 같은 톤을 고른다", () => {
    expect(getPlaceholderTone("GeekNews")).toBe(getPlaceholderTone("GeekNews"));
  });

  it("정의된 톤 중 하나를 고른다", () => {
    for (const seed of ["GeekNews", "토스", "카카오", "", "네이버 D2"]) {
      expect(PLACEHOLDER_TONES).toContain(getPlaceholderTone(seed));
    }
  });

  it("출처가 여러 개면 톤이 한 가지로 몰리지 않는다", () => {
    const tones = new Set(
      ["GeekNews", "토스", "카카오", "라인(LINE)", "NHN Toast", "44BITS"].map(
        getPlaceholderTone
      )
    );
    expect(tones.size).toBeGreaterThan(1);
  });
});

describe("getFeedPlaceholderTone", () => {
  it("관심 분야마다 서로 다른 톤을 쓴다", () => {
    const tones = INTERESTS.map(({ id }) =>
      getFeedPlaceholderTone(id, "GeekNews")
    );
    expect(new Set(tones).size).toBe(INTERESTS.length);
  });

  it("관심 분야가 없으면 출처 이름으로 고른다", () => {
    expect(getFeedPlaceholderTone(undefined, "카카오")).toBe(
      getPlaceholderTone("카카오")
    );
  });
});

describe("hasDisplayableImage", () => {
  it("이미지 주소가 있으면 true", () => {
    expect(hasDisplayableImage("https://static.toss.im/a.png")).toBe(true);
  });

  it("비어 있거나 예전 기본 이미지면 false", () => {
    expect(hasDisplayableImage(undefined)).toBe(false);
    expect(hasDisplayableImage(null)).toBe(false);
    expect(hasDisplayableImage("")).toBe(false);
    expect(hasDisplayableImage(LEGACY_DEFAULT_FEED_IMAGE_URL)).toBe(false);
  });
});
