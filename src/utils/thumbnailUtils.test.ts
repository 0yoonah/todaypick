import { describe, expect, it } from "vitest";
import { LEGACY_DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import { hasDisplayableImage } from "./thumbnailUtils";

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
