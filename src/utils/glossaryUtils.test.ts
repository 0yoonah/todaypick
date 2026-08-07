import { describe, expect, it } from "vitest";
import {
  buildGlossaryKeywordIndex,
  buildKeywordLinks,
  findRelatedCsQuestions,
  findTermByKeyword,
  getRelatedTerms,
  matchesQuery,
  normalizeTermText,
  searchGlossaryTerms,
  toTermMap,
} from "@/utils/glossaryUtils";
import type { CsQuestion } from "@/types/cs";
import type { GlossaryTerm } from "@/types/glossary";

const term = (
  id: string,
  name: string,
  overrides: Partial<GlossaryTerm> = {}
): GlossaryTerm => ({
  id,
  term: name,
  definition: `${name} 정의`,
  detail: `${name}에 대한 상세 설명이다.`,
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

describe("findRelatedCsQuestions", () => {
  const question = (
    id: string,
    text: string,
    keywords: string[]
  ): CsQuestion => ({
    id,
    question: text,
    answer: "답안",
    keywords,
    category: "network",
    created_at: "2026-08-07T00:00:00.000Z",
  });

  const questions = [
    question("net-1", "TCP와 UDP의 차이를 설명해 주세요.", ["연결 지향"]),
    question("os-1", "가상 메모리를 설명해 주세요.", ["페이지 테이블"]),
    question("db-1", "인덱스는 어떻게 동작하나요?", ["B-Tree", "카디널리티"]),
  ];

  it("질문 본문에서 표제어를 찾는다", () => {
    const result = findRelatedCsQuestions(term("tcp", "TCP"), questions);
    expect(result.map((item) => item.id)).toEqual(["net-1"]);
  });

  it("키워드에서도 찾는다", () => {
    const result = findRelatedCsQuestions(term("b-tree", "B-Tree"), questions);
    expect(result.map((item) => item.id)).toEqual(["db-1"]);
  });

  it("다른 표기로도 찾는다", () => {
    const result = findRelatedCsQuestions(
      term("virtual-memory", "Virtual Memory", { aliases: ["가상 메모리"] }),
      questions
    );
    expect(result.map((item) => item.id)).toEqual(["os-1"]);
  });

  it("관련 문항이 없으면 빈 배열을 반환한다", () => {
    expect(findRelatedCsQuestions(term("x", "쿠버네티스"), questions)).toEqual(
      []
    );
  });

  it("한 글자 표기는 오탐을 막기 위해 무시한다", () => {
    expect(findRelatedCsQuestions(term("y", "A"), questions)).toEqual([]);
  });

  it("결과 수를 제한하고 질문 id 순으로 고정한다", () => {
    const many = [
      question("c", "API 설계", ["API"]),
      question("a", "API 인증", ["API"]),
      question("d", "API 버전", ["API"]),
      question("b", "API 캐시", ["API"]),
    ];

    expect(
      findRelatedCsQuestions(term("api", "API"), many).map((item) => item.id)
    ).toEqual(["a", "b", "c"]);
    expect(findRelatedCsQuestions(term("api", "API"), many, 2)).toHaveLength(2);
  });
});

describe("채점 키워드와 용어 연결", () => {
  const question = (id: string, keywords: string[]): CsQuestion => ({
    id,
    question: `${id} 질문`,
    answer: "답안",
    keywords,
    category: "network",
    created_at: "2026-08-07T00:00:00.000Z",
  });

  it("표제어와 표기가 같은 키워드를 연결한다", () => {
    const index = buildGlossaryKeywordIndex(terms);
    expect(findTermByKeyword("TCP", index)?.id).toBe("tcp");
  });

  it("별칭으로만 일치하는 키워드도 연결한다", () => {
    const index = buildGlossaryKeywordIndex(terms);
    expect(findTermByKeyword("Transmission Control Protocol", index)?.id).toBe(
      "tcp"
    );
  });

  it("대소문자와 공백 차이는 무시한다", () => {
    const index = buildGlossaryKeywordIndex(terms);
    expect(findTermByKeyword("  가상메모리 ", index)?.id).toBe(
      "virtual-memory"
    );
    expect(findTermByKeyword("virtual  memory", index)?.id).toBe(
      "virtual-memory"
    );
  });

  it("부분만 겹치는 키워드는 연결하지 않는다", () => {
    const index = buildGlossaryKeywordIndex(terms);
    expect(findTermByKeyword("TCP 헤더", index)).toBeUndefined();
    expect(findTermByKeyword("메모리", index)).toBeUndefined();
  });

  it("한 글자 키워드는 오탐이 많아 연결하지 않는다", () => {
    const index = buildGlossaryKeywordIndex([term("a", "A")]);
    expect(findTermByKeyword("A", index)).toBeUndefined();
  });

  it("같은 표기를 여러 용어가 쓰면 id가 앞서는 용어로 고정한다", () => {
    const duplicated = [
      term("zebra", "겹침"),
      term("alpha", "다른 이름", { aliases: ["겹침"] }),
    ];

    expect(findTermByKeyword("겹침", buildGlossaryKeywordIndex(duplicated))?.id).toBe(
      "alpha"
    );
    expect(
      findTermByKeyword(
        "겹침",
        buildGlossaryKeywordIndex([...duplicated].reverse())
      )?.id
    ).toBe("alpha");
  });

  it("사전에 있는 키워드만 원문 표기 그대로 담는다", () => {
    const links = buildKeywordLinks(
      [question("net-1", ["TCP", "혼잡 제어", "caching"])],
      terms
    );

    expect(links).toEqual({
      TCP: { id: "tcp", term: "TCP" },
      caching: { id: "cache", term: "캐시" },
    });
    expect(links["혼잡 제어"]).toBeUndefined();
  });

  it("여러 문항에 같은 키워드가 있어도 한 번만 담는다", () => {
    const links = buildKeywordLinks(
      [question("net-1", ["TCP"]), question("net-2", ["TCP", "UDP"])],
      terms
    );

    expect(Object.keys(links).sort()).toEqual(["TCP", "UDP"]);
  });
});
