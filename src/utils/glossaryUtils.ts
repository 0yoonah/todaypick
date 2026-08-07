import { normalizeAnswerText } from "@/utils/csUtils";
import type { CsQuestion } from "@/types/cs";
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

/** 너무 짧은 표기는 오탐이 많아 연결 대상에서 제외한다. */
const MIN_LINK_LENGTH = 2;

/**
 * 용어와 관련된 CS 지식 문항을 찾는다.
 * 문항의 질문과 키워드에서 표제어나 다른 표기가 등장하는지 확인한다.
 */
export function findRelatedCsQuestions(
  term: GlossaryTerm,
  questions: CsQuestion[],
  limit = 3
): CsQuestion[] {
  const targets = [term.term, ...term.aliases]
    .map(normalizeTermText)
    .filter((target) => target.length >= MIN_LINK_LENGTH);

  if (targets.length === 0) return [];

  return questions
    .filter((question) => {
      const haystack = normalizeTermText(
        `${question.question} ${question.keywords.join(" ")}`
      );
      return targets.some((target) => haystack.includes(target));
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** 채점 결과 키워드에서 이어 갈 용어 정보 */
export interface GlossaryKeywordLink {
  id: string;
  term: string;
}

/**
 * 표제어와 별칭을 정규화해 용어를 찾을 수 있는 색인을 만든다.
 * 서로 다른 용어가 같은 표기를 쓰면 id가 앞서는 용어를 남겨 결과를 고정한다.
 */
export function buildGlossaryKeywordIndex(
  terms: GlossaryTerm[]
): Map<string, GlossaryTerm> {
  const index = new Map<string, GlossaryTerm>();

  [...terms]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((term) => {
      searchTargets(term)
        .filter((target) => target.length >= MIN_LINK_LENGTH)
        .forEach((target) => {
          if (!index.has(target)) {
            index.set(target, term);
          }
        });
    });

  return index;
}

/** 키워드와 표기가 정확히 일치하는 용어를 찾는다. 부분 일치는 오탐이 많아 쓰지 않는다. */
export function findTermByKeyword(
  keyword: string,
  index: Map<string, GlossaryTerm>
): GlossaryTerm | undefined {
  const normalized = normalizeTermText(keyword);
  if (normalized.length < MIN_LINK_LENGTH) return undefined;

  return index.get(normalized);
}

/**
 * 문항들의 키워드 중 용어사전에 있는 것만 골라 원문 표기 그대로 연결한다.
 * 사전에 없는 키워드는 결과에 담기지 않아 링크 없이 표시된다.
 */
export function buildKeywordLinks(
  questions: CsQuestion[],
  terms: GlossaryTerm[]
): Record<string, GlossaryKeywordLink> {
  const index = buildGlossaryKeywordIndex(terms);
  const links: Record<string, GlossaryKeywordLink> = {};

  questions.forEach((question) => {
    question.keywords.forEach((keyword) => {
      if (links[keyword]) return;

      const term = findTermByKeyword(keyword, index);
      if (term) {
        links[keyword] = { id: term.id, term: term.term };
      }
    });
  });

  return links;
}
