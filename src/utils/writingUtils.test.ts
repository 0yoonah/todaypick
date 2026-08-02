import { describe, expect, it } from "vitest";
import { parseWritingSources } from "./writingUtils";

const source = { id: "a", title: "A", url: "https://example.com/a", source: "Example", category: "it_news", published_at: "2026-08-02", interests: ["frontend"] };

describe("parseWritingSources", () => {
  it("중복 출처 글을 한 번만 유지한다", () => {
    expect(parseWritingSources([source, source])).toHaveLength(1);
  });

  it("안전하지 않은 URL을 제외한다", () => {
    expect(parseWritingSources([{ ...source, url: "javascript:alert(1)" }])).toEqual([]);
  });
});
