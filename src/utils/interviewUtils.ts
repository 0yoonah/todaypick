import type {
  InterviewCategory,
  ReviewConfidence,
} from "@/types/interview";

export const getInterviewCategoryLabel = (category: InterviewCategory) => {
  switch (category) {
    case "network":
      return "네트워크";
    case "os":
      return "운영체제";
    case "database":
      return "데이터베이스";
    case "algorithm":
      return "자료구조·알고리즘";
    case "web":
      return "웹";
    case "language":
      return "언어";
    case "system_design":
      return "시스템 설계";
    default:
      return category;
  }
};

export const getInterviewCategoryColor = (category: InterviewCategory) => {
  switch (category) {
    case "network":
      return "border-info/25 bg-info/10 text-info";
    case "os":
      return "border-border bg-secondary text-secondary-foreground";
    case "database":
      return "border-info/25 bg-info/10 text-info";
    case "algorithm":
      return "border-primary/25 bg-accent text-accent-foreground";
    case "web":
      return "border-primary/25 bg-primary/10 text-primary";
    case "language":
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
