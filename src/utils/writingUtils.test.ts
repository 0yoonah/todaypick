import { describe, expect, it } from "vitest";
import {
  createWritingFormSnapshot,
  hasWritingFormChanges,
  parseWritingSources,
  parseWritingThumbnailUrl,
  parseWritingVisibility,
} from "./writingUtils";
import type { WritingDraft } from "@/types/writing";

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

describe("createWritingFormSnapshot / hasWritingFormChanges", () => {
  const draft: WritingDraft = {
    id: "draft-1",
    title: "제목",
    content: "본문",
    tags: ["frontend"],
    visibility: "private",
    thumbnail_url: "https://example.com/a.png",
    sources: [parseWritingSources([source])[0]],
    created_at: "2026-08-03T00:00:00.000Z",
    updated_at: "2026-08-03T00:00:00.000Z",
  };

  it("기존 글을 열자마자는 변경이 없다고 판단한다", () => {
    const initial = createWritingFormSnapshot(draft);
    expect(hasWritingFormChanges(initial, createWritingFormSnapshot(draft))).toBe(
      false
    );
  });

  it("제목, 본문, 공개 여부, 태그, 인용, 썸네일 변경을 감지한다", () => {
    const initial = createWritingFormSnapshot(draft);
    const changes = [
      { title: "새 제목" },
      { content: "새 본문" },
      { visibility: "public" as const },
      { tags: [] },
      { sourceIds: [] },
      { thumbnailUrl: null },
    ];

    changes.forEach((change) => {
      expect(hasWritingFormChanges(initial, { ...initial, ...change })).toBe(true);
    });
  });

  it("값을 바꿨다가 되돌리면 변경 없음으로 판단한다", () => {
    const initial = createWritingFormSnapshot(draft);
    const reverted = { ...initial, title: "새 제목" };
    expect(hasWritingFormChanges(initial, reverted)).toBe(true);
    expect(
      hasWritingFormChanges(initial, { ...reverted, title: draft.title })
    ).toBe(false);
  });

  it("태그 순서만 다르면 변경으로 보지 않는다", () => {
    const initial = createWritingFormSnapshot({
      ...draft,
      tags: ["frontend", "backend"],
    });
    expect(
      hasWritingFormChanges(initial, {
        ...initial,
        tags: ["backend", "frontend"],
      })
    ).toBe(false);
  });

  it("새 썸네일 파일을 선택하면 변경으로 판단한다", () => {
    const initial = createWritingFormSnapshot(draft);
    expect(hasWritingFormChanges(initial, { ...initial }, true)).toBe(true);
  });

  it("새 글은 입력이 없으면 변경이 없고 공백만 입력해도 변경이 아니다", () => {
    const initial = createWritingFormSnapshot(null);
    expect(hasWritingFormChanges(initial, initial)).toBe(false);
    expect(
      hasWritingFormChanges(initial, { ...initial, title: "   " })
    ).toBe(false);
    expect(hasWritingFormChanges(initial, { ...initial, title: "제목" })).toBe(
      true
    );
  });
});
