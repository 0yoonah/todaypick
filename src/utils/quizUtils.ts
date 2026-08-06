import { Quiz, QuizCategory } from "@/types/quiz";
import { quizzes } from "@/data/quizzes";
import { getSeoulDateKey } from "@/utils/dateUtils";

export function getTodayQuiz(): Quiz {
  if (!quizzes || quizzes.length === 0) {
    throw new Error("퀴즈 데이터가 없습니다.");
  }

  const dateString = getSeoulDateKey();
  const dateNumber = parseInt(dateString.replace(/-/g, ""));

  return quizzes[dateNumber % quizzes.length];
}

export const getCategoryLabel = (category: QuizCategory) => {
  switch (category) {
    case "programming":
      return "프로그래밍";
    case "web":
      return "웹 개발";
    case "database":
      return "데이터베이스";
    case "security":
      return "보안";
    case "cloud":
      return "클라우드";
    case "algorithm":
      return "알고리즘";
    case "devops":
      return "DevOps";
    case "network":
      return "네트워크";
    case "mobile":
      return "모바일";
    case "general":
      return "일반";
    default:
      return category;
  }
};

export const getCategoryColor = (category: QuizCategory) => {
  switch (category) {
    case "programming":
      return "border-primary/25 bg-primary/10 text-primary";
    case "web":
      return "border-info/25 bg-info/10 text-info";
    case "database":
      return "border-info/25 bg-info/10 text-info";
    case "security":
      return "border-destructive/25 bg-destructive/10 text-destructive";
    case "cloud":
      return "border-warning/30 bg-warning/10 text-foreground";
    case "algorithm":
      return "border-primary/25 bg-accent text-accent-foreground";
    case "devops":
      return "border-border bg-secondary text-secondary-foreground";
    case "network":
      return "border-info/25 bg-info/10 text-info";
    case "mobile":
      return "border-primary/25 bg-primary/10 text-primary";
    case "general":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};
