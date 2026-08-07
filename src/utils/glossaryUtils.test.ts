import { describe, expect, it } from "vitest";
import {
  getRelatedTerms,
  matchesQuery,
  normalizeTermText,
  searchGlossaryTerms,
  toTermMap,
} from "@/utils/glossaryUtils";
import type { GlossaryTerm } from "@/types/glossary";

const term = (
  id: string,
  name: string,
  overrides: Partial<GlossaryTerm> = {}
): GlossaryTerm => ({
  id,
  term: name,
  definition: `${name} 정의`,
  aliases: [],
  category: "network",
  related: [],
  created_at: "2026-08-07T00:00:00.000Z",
  ...overrides,
});

const terms: GlossaryTerm[] = [
  term("tcp", "TCP", { aliases: ["Transmission Control Protocol"] }),
  term("udp", "UDP", { related: ["tcp"] }),
  term("virtual-memory", "가상 메모리", {
    aliases: ["virtual memory"],
    category: "os",
  }),
  term("cache", "캐시", { aliases: ["caching", "TTL"], category: "backend" }),
];

describe("matchesQuery", () => {
  it("빈 검색어는 모두 통과시킨다", () => {
    terms.forEach((item) => expect(matchesQuery(item, "")).toBe(true));
    expect(matchesQuery(terms[0], "   ")).toBe(true);
  });

  it("표제어로 찾는다", () => {
    expect(matchesQuery(terms[0], "TCP")).toBe(true);
    expect(matchesQuery(terms[0], "UDP")).toBe(false);
  });

  it("별칭으로도 찾는다", () => {
    expect(matchesQuery(terms[2], "virtual memory")).toBe(true);
    expect(matchesQuery(terms[3], "TTL")).toBe(true);
  });

  it("대소문자와 공백 차이를 무시한다", () => {
    expect(matchesQuery(terms[0], "tcp")).toBe(true);
    expect(matchesQuery(terms[2], "가상메모리")).toBe(true);
    expect(matchesQuery(terms[2], "  가상 메모리  ")).toBe(true);
  });

  it("부분 문자열도 인식한다", () => {
    expect(matchesQuery(terms[2], "메모리")).toBe(true);
  });
});

describe("searchGlossaryTerms", () => {
  it("검색어가 없으면 전체를 가나다순으로 반환한다", () => {
    const result = searchGlossaryTerms(terms);

    expect(result).toHaveLength(4);
    // 한국어 로캘 기준이라 한글 표제어가 영문보다 앞선다.
    expect(result.map((item) => item.id)).toEqual([
      "virtual-memory",
      "cache",
      "tcp",
      "udp",
    ]);
  });

  it("검색 결과도 가나다순으로 정렬한다", () => {
    const list = [
      term("a", "메모리 누수"),
      term("b", "가상 메모리"),
      term("c", "메모리"),
    ];

    expect(
      searchGlossaryTerms(list, { query: "메모리" }).map((item) => item.id)
    ).toEqual(["b", "c", "a"]);
  });

  it("표제어가 같으면 id로 순서를 고정한다", () => {
    const list = [term("z", "캐시"), term("a", "캐시")];

    expect(searchGlossaryTerms(list).map((item) => item.id)).toEqual(["a", "z"]);
  });

  it("결과가 없으면 빈 배열을 반환한다", () => {
    expect(searchGlossaryTerms(terms, { query: "존재하지않는용어" })).toEqual(
      []
    );
  });

  it("같은 입력에 같은 순서를 반환하고 원본을 바꾸지 않는다", () => {
    const first = searchGlossaryTerms(terms).map((item) => item.id);
    const second = searchGlossaryTerms([...terms].reverse()).map(
      (item) => item.id
    );

    expect(first).toEqual(second);
    expect(terms.map((item) => item.id)).toEqual([
      "tcp",
      "udp",
      "virtual-memory",
      "cache",
    ]);
  });
});

describe("toTermMap / getRelatedTerms", () => {
  it("id로 용어를 찾는다", () => {
    const map = toTermMap(terms);
    expect(map.get("tcp")?.term).toBe("TCP");
    expect(map.get("없음")).toBeUndefined();
  });

  it("관련 용어를 실제 용어로 바꾼다", () => {
    const related = getRelatedTerms(terms[1], toTermMap(terms));
    expect(related.map((item) => item.id)).toEqual(["tcp"]);
  });

  it("존재하지 않는 관련 id는 건너뛴다", () => {
    const broken = term("x", "X", { related: ["tcp", "없는id"] });
    expect(
      getRelatedTerms(broken, toTermMap(terms)).map((item) => item.id)
    ).toEqual(["tcp"]);
  });
});

describe("normalizeTermText", () => {
  it("공백과 구분 기호를 없애고 소문자로 맞춘다", () => {
    expect(normalizeTermText("Virtual Memory")).toBe("virtualmemory");
    expect(normalizeTermText("블루-그린 배포")).toBe("블루그린배포");
  });
});
