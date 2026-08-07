import { normalizeAnswerText } from "@/utils/csUtils";
import type { CsCategory } from "@/types/cs";
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
 * 분야와 검색어로 용어를 걸러 결정적 순서로 정렬한다.
 * 표제어가 검색어로 시작하는 항목을 먼저 보여주고, 같은 조건에서는 표제어와 id 순으로 고정한다.
 */
export function searchGlossaryTerms(
  terms: GlossaryTerm[],
  { query = "", category }: { query?: string; category?: CsCategory } = {}
): GlossaryTerm[] {
  const normalizedQuery = normalizeTermText(query);
  const filtered = terms.filter(
    (term) =>
      (category === undefined || term.category === category) &&
      matchesQuery(term, query)
  );

  const startsWithQuery = (term: GlossaryTerm) =>
    normalizedQuery.length > 0 &&
    searchTargets(term).some((target) => target.startsWith(normalizedQuery));

  return [...filtered].sort((a, b) => {
    const priority = Number(startsWithQuery(b)) - Number(startsWithQuery(a));
    return (
      priority || a.term.localeCompare(b.term, "ko") || a.id.localeCompare(b.id)
    );
  });
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
