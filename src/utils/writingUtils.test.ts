import { describe, expect, it } from "vitest";
import {
  createWritingFormSnapshot,
  DEFAULT_PUBLIC_DRAFT_LIMIT,
  MAX_PUBLIC_DRAFT_LIMIT,
  paginateDrafts,
  parseWritingDraftPagination,
  sortPublicDrafts,
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

describe("parseWritingDraftPagination", () => {
  it("page와 limit이 모두 없으면 null을 반환한다", () => {
    expect(parseWritingDraftPagination(new URLSearchParams())).toBeNull();
    expect(
      parseWritingDraftPagination(new URLSearchParams("scope=public"))
    ).toBeNull();
  });

  it("한쪽만 있어도 나머지는 기본값을 사용한다", () => {
    expect(parseWritingDraftPagination(new URLSearchParams("page=2"))).toEqual({
      page: 2,
      limit: DEFAULT_PUBLIC_DRAFT_LIMIT,
    });
    expect(parseWritingDraftPagination(new URLSearchParams("limit=3"))).toEqual({
      page: 1,
      limit: 3,
    });
  });

  it.each(["0", "-1", "1.5", "text", ""])("잘못된 page=%s를 거부한다", (page) => {
    expect(() =>
      parseWritingDraftPagination(new URLSearchParams({ page }))
    ).toThrow("page는 1 이상의 정수여야 합니다.");
  });

  it.each(["0", "51", "2.5", "text", ""])(
    "잘못된 limit=%s를 거부한다",
    (limit) => {
      expect(() =>
        parseWritingDraftPagination(new URLSearchParams({ limit }))
      ).toThrow(`limit은 1 이상 ${MAX_PUBLIC_DRAFT_LIMIT} 이하의 정수여야 합니다.`);
    }
  );
});

describe("sortPublicDrafts", () => {
  const draft = (id: string, updated_at: string) => ({ id, updated_at });

  it("최근 수정순으로 정렬한다", () => {
    const sorted = sortPublicDrafts([
      draft("a", "2026-08-01T00:00:00.000Z"),
      draft("b", "2026-08-03T00:00:00.000Z"),
      draft("c", "2026-08-02T00:00:00.000Z"),
    ]);
    expect(sorted.map(({ id }) => id)).toEqual(["b", "c", "a"]);
  });

  it("수정 시각이 같으면 id로 순서를 고정한다", () => {
    const same = "2026-08-03T00:00:00.000Z";
    const input = [draft("c", same), draft("a", same), draft("b", same)];
    expect(sortPublicDrafts(input).map(({ id }) => id)).toEqual(["a", "b", "c"]);
    expect(sortPublicDrafts([...input].reverse()).map(({ id }) => id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const input = [
      draft("a", "2026-08-01T00:00:00.000Z"),
      draft("b", "2026-08-03T00:00:00.000Z"),
    ];
    sortPublicDrafts(input);
    expect(input.map(({ id }) => id)).toEqual(["a", "b"]);
  });
});

describe("paginateDrafts", () => {
  const items = ["1", "2", "3", "4", "5"];

  it("페이지 경계에서 항목이 빠지거나 중복되지 않는다", () => {
    const first = paginateDrafts(items, 1, 2);
    const second = paginateDrafts(items, 2, 2);
    const third = paginateDrafts(items, 3, 2);

    expect(first.drafts).toEqual(["1", "2"]);
    expect(second.drafts).toEqual(["3", "4"]);
    expect(third.drafts).toEqual(["5"]);
    expect([...first.drafts, ...second.drafts, ...third.drafts]).toEqual(items);
  });

  it("전체 개수와 페이지 정보를 함께 반환한다", () => {
    expect(paginateDrafts(items, 1, 2)).toEqual({
      drafts: ["1", "2"],
      totalCount: 5,
      totalPages: 3,
      currentPage: 1,
    });
  });

  it("범위를 넘는 페이지는 빈 목록을 반환한다", () => {
    expect(paginateDrafts(items, 4, 2).drafts).toEqual([]);
  });

  it("항목이 없으면 페이지 수가 0이다", () => {
    expect(paginateDrafts([], 1, 12)).toEqual({
      drafts: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    });
  });
});
