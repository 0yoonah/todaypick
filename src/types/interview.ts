export const INTERVIEW_CATEGORIES = [
  "network",
  "os",
  "database",
  "algorithm",
  "web",
  "language",
  "system_design",
] as const;

export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number];

export const isInterviewCategory = (
  value: unknown
): value is InterviewCategory =>
  typeof value === "string" &&
  (INTERVIEW_CATEGORIES as readonly string[]).includes(value);

export interface InterviewQuestion {
  id: string;
  question: string;
  /** 스스로 설명한 뒤 확인하는 모범 답안 */
  answer: string;
  /** 답변에 반드시 포함해야 하는 핵심 개념 */
  keywords: string[];
  category: InterviewCategory;
  created_at: string;
}

/** 답안을 확인한 뒤 스스로 내리는 평가 */
export const REVIEW_CONFIDENCES = ["explained", "unsure", "unknown"] as const;

export type ReviewConfidence = (typeof REVIEW_CONFIDENCES)[number];

export const isReviewConfidence = (
  value: unknown
): value is ReviewConfidence =>
  typeof value === "string" &&
  (REVIEW_CONFIDENCES as readonly string[]).includes(value);

export interface InterviewReview {
  question_id: string;
  confidence: ReviewConfidence;
  reviewed_at: string;
}
