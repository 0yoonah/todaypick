import { CS_CATEGORIES } from "@/types/cs";
import type {
  CsCategory,
  CsGradeResult,
  CsQuestion,
  CsReview,
} from "@/types/cs";

/** 선택한 분야의 질문만 남긴다. 분야를 고르지 않으면 전체를 반환한다. */
export const filterCsQuestions = (
  questions: CsQuestion[],
  category?: CsCategory
): CsQuestion[] =>
  category ? questions.filter((question) => question.category === category) : questions;

export const getCsCategoryLabel = (category: CsCategory) => {
  switch (category) {
    case "network":
      return "네트워크";
    case "os":
      return "운영체제";
    case "database":
      return "데이터베이스";
    case "algorithm":
      return "자료구조·알고리즘";
    case "frontend":
      return "프론트엔드";
    case "backend":
      return "백엔드";
    case "system_design":
      return "시스템 설계";
    default:
      return category;
  }
};

export const getCsCategoryColor = (category: CsCategory) => {
  switch (category) {
    case "network":
      return "border-info/25 bg-info/10 text-info";
    case "os":
      return "border-border bg-secondary text-secondary-foreground";
    case "database":
      return "border-info/25 bg-info/10 text-info";
    case "algorithm":
      return "border-primary/25 bg-accent text-accent-foreground";
    case "frontend":
      return "border-primary/25 bg-primary/10 text-primary";
    case "backend":
      return "border-warning/30 bg-warning/10 text-foreground";
    case "system_design":
      return "border-destructive/25 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

/** 채점 기록 캐시 키 */
export const CS_REVIEWS_QUERY_KEY = ["cs-reviews"] as const;

/** 답변 입력 상한. DB 제약과 동일하게 유지한다. */
export const MAX_CS_ANSWER_LENGTH = 2000;

/** 복습이 필요하다고 보는 기준 점수 */
export const CS_PASS_SCORE = 60;

/**
 * 표기 차이를 흡수하기 위해 비교용으로 정규화한다.
 * 공백, 가운뎃점, 하이픈 등을 없애고 소문자로 맞춘다.
 */
export const normalizeAnswerText = (value: string): string =>
  value.toLowerCase().replace(/[\s·・\-_/(),.]/g, "");

/**
 * 정규화한 답변에 키워드가 언급됐는지 판단한다.
 * 붙여 쓴 경우와 조사가 끼어든 경우를 모두 인식하도록,
 * 키워드 전체가 그대로 있거나 구성 단어가 모두 등장하면 언급으로 본다.
 */
const hasKeyword = (normalizedAnswer: string, keyword: string): boolean => {
  const normalizedKeyword = normalizeAnswerText(keyword);
  if (normalizedKeyword.length === 0) return false;
  if (normalizedAnswer.includes(normalizedKeyword)) return true;

  const tokens = keyword
    .split(/[\s·・/]+/)
    .map(normalizeAnswerText)
    .filter((token) => token.length > 0);

  return (
    tokens.length > 1 &&
    tokens.every((token) => normalizedAnswer.includes(token))
  );
};

/**
 * 답변에 키워드가 언급됐는지 세어 참고 점수를 매긴다.
 * 표기 차이는 정규화로 흡수하지만 동의어는 인식하지 못한다.
 */
export function gradeCsAnswer(
  answer: string,
  keywords: string[]
): CsGradeResult {
  const normalizedAnswer = normalizeAnswerText(answer);
  const matched: string[] = [];
  const missed: string[] = [];

  keywords.forEach((keyword) => {
    (hasKeyword(normalizedAnswer, keyword) ? matched : missed).push(keyword);
  });

  const total = keywords.length;
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);

  return { score, matched, missed, total };
}

/** 점수에 따른 안내 문구 */
export const getScoreFeedback = (score: number): string => {
  if (score >= 80) return "핵심 개념을 잘 짚었어요.";
  if (score >= CS_PASS_SCORE) return "핵심은 짚었지만 빠진 개념이 있어요.";
  return "놓친 개념이 많아요. 모범 답안을 확인해보세요.";
};

/** 복습이 필요한 점수인지 판단한다. */
export const needsReview = (score: number): boolean => score < CS_PASS_SCORE;

/** 저장된 채점 기록으로 화면에 표시할 결과를 복원한다. */
export function restoreGradeResult(
  keywords: string[],
  matchedKeywords: string[],
  score: number
): CsGradeResult {
  const matchedSet = new Set(matchedKeywords);
  const matched = keywords.filter((keyword) => matchedSet.has(keyword));

  return {
    score,
    matched,
    missed: keywords.filter((keyword) => !matchedSet.has(keyword)),
    total: keywords.length,
  };
}

/** 질문 id로 채점 기록을 찾을 수 있게 정리한다. */
export function toReviewMap(reviews: CsReview[]): Map<string, CsReview> {
  return new Map(reviews.map((review) => [review.question_id, review]));
}

/**
 * 기준 점수 미만으로 채점된 질문만 복습 순서대로 정렬한다.
 * 점수가 낮을수록, 마지막으로 푼 지 오래됐을수록 먼저 보여준다.
 * 같은 조건에서도 순서가 흔들리지 않도록 질문 id를 마지막 정렬 키로 둔다.
 */
export function selectReviewQuestions(
  questions: CsQuestion[],
  reviews: Map<string, CsReview>
): CsQuestion[] {
  return questions
    .filter((question) => {
      const review = reviews.get(question.id);
      return review !== undefined && needsReview(review.score);
    })
    .sort((a, b) => {
      const reviewA = reviews.get(a.id) as CsReview;
      const reviewB = reviews.get(b.id) as CsReview;

      return (
        reviewA.score - reviewB.score ||
        reviewA.reviewed_at.localeCompare(reviewB.reviewed_at) ||
        a.id.localeCompare(b.id)
      );
    });
}

export interface CsCategoryProgress {
  category: CsCategory;
  /** 해당 분야의 전체 문항 수 */
  total: number;
  /** 채점 기록이 있는 문항 수 */
  solved: number;
  /** 푼 문항의 평균 점수. 푼 문항이 없으면 0 */
  averageScore: number;
  /** 기준 점수 미만인 문항 수 */
  needsReviewCount: number;
}

export interface CsProgressSummary extends Omit<CsCategoryProgress, "category"> {
  byCategory: CsCategoryProgress[];
}

const averageOf = (scores: number[]): number =>
  scores.length === 0
    ? 0
    : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

/**
 * 채점 기록을 전체와 분야별로 집계한다.
 * 평균 점수는 푼 문항만 대상으로 하고 소수점 첫째 자리에서 반올림한다.
 */
export function summarizeCsProgress(
  questions: CsQuestion[],
  reviews: Map<string, CsReview>
): CsProgressSummary {
  const byCategory = CS_CATEGORIES.map((category) => {
    const categoryQuestions = questions.filter(
      (question) => question.category === category
    );
    const scores = categoryQuestions
      .map((question) => reviews.get(question.id)?.score)
      .filter((score): score is number => score !== undefined);

    return {
      category,
      total: categoryQuestions.length,
      solved: scores.length,
      averageScore: averageOf(scores),
      needsReviewCount: scores.filter(needsReview).length,
    };
  }).filter((progress) => progress.total > 0);

  const allScores = questions
    .map((question) => reviews.get(question.id)?.score)
    .filter((score): score is number => score !== undefined);

  return {
    total: questions.length,
    solved: allScores.length,
    averageScore: averageOf(allScores),
    needsReviewCount: allScores.filter(needsReview).length,
    byCategory,
  };
}
