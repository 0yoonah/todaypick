import { describe, expect, it } from "vitest";
import {
  parseWritingSources,
  parseWritingThumbnailUrl,
  parseWritingVisibility,
} from "./writingUtils";

const source = { id: "a", title: "A", url: "https://example.com/a", source: "Example", category: "it_news", published_at: "2026-08-02", interests: ["frontend"] };

describe("parseWritingSources", () => {
  it("중복 출처 글을 한 번만 유지한다", () => {
    expect(parseWritingSources([source, source])).toHaveLength(1);
  });

  it("안전하지 않은 URL을 제외한다", () => {
    expect(parseWritingSources([{ ...source, url: "javascript:alert(1)" }])).toEqual([]);
  });
});

describe("parseWritingVisibility", () => {
  it("비공개 값을 유지한다", () => {
    expect(parseWritingVisibility("private")).toBe("private");
  });

  it("값이 없으면 공개를 기본값으로 사용한다", () => {
    expect(parseWritingVisibility(undefined)).toBe("public");
  });
});

describe("parseWritingThumbnailUrl", () => {
  it("허용된 이미지 data URL을 유지한다", () => {
    expect(parseWritingThumbnailUrl("data:image/png;base64,aGVsbG8=")).toBe(
      "data:image/png;base64,aGVsbG8="
    );
  });

  it("이미지가 아닌 data URL은 제외한다", () => {
    expect(parseWritingThumbnailUrl("data:text/html;base64,aGVsbG8=")).toBeNull();
  });
});
