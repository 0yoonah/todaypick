import { describe, expect, it } from "vitest";
import { extractFirstImageUrl, selectFeedImageUrl } from "./feedImageUtils";

describe("RSS feed image selection", () => {
  it("ignores non-image enclosures", () => {
    expect(
      selectFeedImageUrl(
        [
          {
            url: "https://d2908q01vomqb2.cloudfront.net/audio/sample.wav",
            type: "audio/wav",
          },
        ],
        []
      )
    ).toBeUndefined();
  });

  it("uses an allowed image MIME type without an extension", () => {
    expect(
      selectFeedImageUrl(
        [
          {
            url: "https://d2.naver.com/media/thumbnail?id=1",
            type: "image/jpeg",
          },
        ],
        []
      )
    ).toBe("https://d2.naver.com/media/thumbnail?id=1");
  });

  it("falls back to the first image embedded in RSS content", () => {
    expect(
      selectFeedImageUrl(
        [],
        [
          '<p>본문</p><img src="https://d2908q01vomqb2.cloudfront.net/image.jpg?width=800">',
        ]
      )
    ).toBe(
      "https://d2908q01vomqb2.cloudfront.net/image.jpg?width=800"
    );
  });

  it("rejects embedded images from unconfigured hosts", () => {
    expect(
      selectFeedImageUrl(
        [],
        ['<img src="https://unknown.example.com/image.jpg">']
      )
    ).toBeUndefined();
  });

  it("ignores RSS content parsed as a non-string value", () => {
    expect(
      selectFeedImageUrl([], [{ _: "<img src='invalid.jpg'>" }])
    ).toBeUndefined();
  });
});

describe("extractFirstImageUrl", () => {
  it("supports single-quoted and unquoted src attributes", () => {
    expect(
      extractFirstImageUrl([
        "<img alt='cover' src='https://d2.naver.com/image.png'>",
      ])
    ).toBe("https://d2.naver.com/image.png");
    expect(
      extractFirstImageUrl([
        "<img src=https://d2.naver.com/image.webp>",
      ])
    ).toBe("https://d2.naver.com/image.webp");
  });
});
