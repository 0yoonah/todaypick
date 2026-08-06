import { Quiz, QuizCategory } from "@/types/quiz";
import { quizzes } from "@/data/quizzes";
import { getSeoulDateKey } from "@/utils/dateUtils";

/**
 * 서울 날짜 키를 문항 선택에 사용할 정수로 바꾼다.
 * 날짜 숫자를 그대로 나누면 문항 수가 10일 때 끝자리만 반영돼 분포가 치우친다.
 */
export function hashDateKey(dateKey: string): number {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index++) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

/**
 * 하루에 한 문제를 결정적으로 고른다.
 * 이미 푼 문제는 후보에서 제외하고, 남은 문제가 없으면 null을 반환한다.
 */
export function selectDailyQuiz(
  pool: Quiz[],
  dateKey: string,
  solvedIds: Iterable<string> = []
): Quiz | null {
  const solved = new Set(solvedIds);
  const available = pool.filter((quiz) => !solved.has(quiz.id));

  if (available.length === 0) return null;

  return available[hashDateKey(dateKey) % available.length];
}

/** 개인화가 없는 오늘의 퀴즈. 비로그인 사용자가 사용한다. */
export function getTodayQuiz(): Quiz {
  const quiz = selectDailyQuiz(quizzes, getSeoulDateKey());

  if (!quiz) {
    throw new Error("퀴즈 데이터가 없습니다.");
  }

  return quiz;
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
