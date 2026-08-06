import type {
  CsCategory,
  CsQuestion,
  ReviewConfidence,
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

export const getConfidenceLabel = (confidence: ReviewConfidence) => {
  switch (confidence) {
    case "explained":
      return "설명했어요";
    case "unsure":
      return "애매해요";
    case "unknown":
      return "몰랐어요";
    default:
      return confidence;
  }
};
