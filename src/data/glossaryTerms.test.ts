import { describe, expect, it } from "vitest";
import { glossaryTerms } from "@/data/glossaryTerms";
import { CS_CATEGORIES } from "@/types/cs";
import { normalizeTermText } from "@/utils/glossaryUtils";

const MIN_TERMS = 100;

describe("glossaryTerms 데이터", () => {
  it(`용어가 ${MIN_TERMS}개 이상이다`, () => {
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(MIN_TERMS);
  });

  it("id가 중복되지 않는다", () => {
    const ids = glossaryTerms.map((term) => term.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("표제어가 중복되지 않는다", () => {
    const terms = glossaryTerms.map((term) => normalizeTermText(term.term));
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("표제어와 정의가 비어 있지 않다", () => {
    glossaryTerms.forEach((term) => {
      expect(term.term.trim().length).toBeGreaterThan(0);
      expect(term.definition.trim().length).toBeGreaterThan(0);
    });
  });

  it("목록에 노출할 정의는 한두 문장으로 짧게 유지한다", () => {
    glossaryTerms.forEach((term) => {
      expect(term.definition.length).toBeLessThanOrEqual(200);
    });
  });

  it("상세 설명이 요약보다 충분히 길다", () => {
    glossaryTerms.forEach((term) => {
      expect(term.detail.trim().length).toBeGreaterThanOrEqual(150);
      expect(term.detail.trim()).not.toBe(term.definition.trim());
      expect(term.detail.length).toBeGreaterThan(term.definition.length);
    });
  });

  it("상세 설명이 여러 문장으로 이뤄진다", () => {
    glossaryTerms.forEach((term) => {
      const sentences = term.detail
        .split(/(?<=다\.)\s+/)
        .filter((sentence) => sentence.trim().length > 0);
      expect(sentences.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("별칭에 중복이 없고 표제어와 겹치지 않는다", () => {
    glossaryTerms.forEach((term) => {
      const normalized = term.aliases.map(normalizeTermText);
      expect(new Set(normalized).size).toBe(normalized.length);
      expect(normalized).not.toContain(normalizeTermText(term.term));
      normalized.forEach((alias) => {
        expect(alias.length).toBeGreaterThan(0);
      });
    });
  });

  it("related가 실제 존재하는 id를 가리킨다", () => {
    const ids = new Set(glossaryTerms.map((term) => term.id));
    glossaryTerms.forEach((term) => {
      term.related.forEach((relatedId) => {
        expect(ids.has(relatedId)).toBe(true);
      });
      expect(term.related).not.toContain(term.id);
    });
  });

  it("정의되지 않은 분류를 사용하지 않는다", () => {
    glossaryTerms.forEach((term) => {
      expect(CS_CATEGORIES).toContain(term.category);
    });
  });

  it("모든 분류에 용어가 있다", () => {
    const counts = glossaryTerms.reduce<Record<string, number>>((acc, term) => {
      acc[term.category] = (acc[term.category] ?? 0) + 1;
      return acc;
    }, {});

    CS_CATEGORIES.forEach((category) => {
      expect(counts[category] ?? 0).toBeGreaterThan(0);
    });
  });

  it("created_at이 모듈 로드마다 달라지지 않는 고정 값이다", () => {
    glossaryTerms.forEach((term) => {
      expect(term.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
    expect(new Set(glossaryTerms.map((term) => term.created_at)).size).toBe(1);
  });
});
