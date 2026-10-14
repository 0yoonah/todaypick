import { describe, expect, it } from "vitest";
import { isAllowedFeedImageUrl } from "./feedImages";

describe("RSS 썸네일 허용 호스트", () => {
  it.each([
    "https://boostbrothers.github.io/assets/images/post/cover.png",
    "https://hyper-accel.github.io/posts/composition-and-category/cover.png",
    "https://tech.hancom.com/wp-content/uploads/2026/08/thumbnail.png",
    "https://techtopic.skplanet.com/content/images/2026/09/cover.png",
  ])("v1.12.1에 추가한 출처의 이미지를 허용한다: %s", (url) => {
    expect(isAllowedFeedImageUrl(url)).toBe(true);
  });

  it("허용 목록에 없는 호스트의 이미지는 거부한다", () => {
    expect(isAllowedFeedImageUrl("https://unknown.example.com/a.png")).toBe(
      false
    );
  });
});
