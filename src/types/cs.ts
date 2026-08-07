export const CS_CATEGORIES = [
  "network",
  "os",
  "database",
  "algorithm",
  "frontend",
  "backend",
  "system_design",
] as const;

export type CsCategory = (typeof CS_CATEGORIES)[number];

export const isCsCategory = (
  value: unknown
): value is CsCategory =>
  typeof value === "string" &&
  (CS_CATEGORIES as readonly string[]).includes(value);

export interface CsQuestion {
  id: string;
  question: string;
  /** 스스로 설명한 뒤 확인하는 모범 답안 */
  answer: string;
  /** 답변에 반드시 포함해야 하는 핵심 개념 */
  keywords: string[];
  category: CsCategory;
  created_at: string;
}

/** 키워드 언급 기준 채점 결과 */
export interface CsGradeResult {
  /** 0~100 사이의 참고 점수 */
  score: number;
  /** 답변에서 확인된 키워드 */
  matched: string[];
  /** 답변에서 확인되지 않은 키워드 */
  missed: string[];
  /** 채점 대상 키워드 수 */
  total: number;
}

export interface CsReview {
  question_id: string;
  score: number;
  matched_keywords: string[];
  answer: string;
  reviewed_at: string;
}
