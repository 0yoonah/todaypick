import { normalizeAnswerText } from "@/utils/csUtils";
import type { GlossaryTerm } from "@/types/glossary";

/** 검색과 비교에 쓰는 정규화. CS 지식 채점과 같은 규칙을 사용한다. */
export const normalizeTermText = normalizeAnswerText;

/** 표제어와 별칭을 모두 정규화해 검색 대상으로 만든다. */
const searchTargets = (term: GlossaryTerm): string[] =>
  [term.term, ...term.aliases].map(normalizeTermText);

/** 표제어나 별칭이 검색어를 포함하는지 확인한다. */
export function matchesQuery(term: GlossaryTerm, query: string): boolean {
  const normalizedQuery = normalizeTermText(query);
  if (normalizedQuery.length === 0) return true;

  return searchTargets(term).some((target) => target.includes(normalizedQuery));
}

/**
 * 검색어로 용어를 걸러 가나다순으로 정렬한다.
 * 같은 표제어가 없도록 id를 마지막 정렬 키로 둬 순서를 고정한다.
 * 한국어 로캘 기준이라 한글 표제어가 영문보다 앞선다.
 */
export function searchGlossaryTerms(
  terms: GlossaryTerm[],
  { query = "" }: { query?: string } = {}
): GlossaryTerm[] {
  return terms
    .filter((term) => matchesQuery(term, query))
    .sort(
      (a, b) =>
        a.term.localeCompare(b.term, "ko") || a.id.localeCompare(b.id)
    );
}

/** id로 용어를 찾을 수 있게 정리한다. */
export function toTermMap(terms: GlossaryTerm[]): Map<string, GlossaryTerm> {
  return new Map(terms.map((term) => [term.id, term]));
}

/** 관련 용어 id를 실제 용어로 바꾼다. 없는 id는 건너뛴다. */
export function getRelatedTerms(
  term: GlossaryTerm,
  terms: Map<string, GlossaryTerm>
): GlossaryTerm[] {
  return term.related
    .map((id) => terms.get(id))
    .filter((related): related is GlossaryTerm => related !== undefined);
}
