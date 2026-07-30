import { describe, expect, it } from "vitest";
import { selectFeedImageUrl } from "./feedImageUtils";

describe("selectFeedImageUrl", () => {
  it("ignores non-image enclosures", () => {
    expect(
      selectFeedImageUrl([
        {
          url: "https://example.com/new-voices/sample.wav",
          type: "audio/wav",
        },
      ])
    ).toBeUndefined();
  });

  it("uses an image MIME type even when the URL has no extension", () => {
    expect(
      selectFeedImageUrl([
        {
          url: "https://example.com/media/thumbnail?id=1",
          type: "image/jpeg",
        },
      ])
    ).toBe("https://example.com/media/thumbnail?id=1");
  });

  it("uses an image extension when a MIME type is omitted", () => {
    expect(
      selectFeedImageUrl([
        { url: "https://example.com/article/cover.webp?width=800" },
      ])
    ).toBe("https://example.com/article/cover.webp?width=800");
  });
});
