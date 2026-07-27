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
    default:
      return category;
  }
};

export const getCategoryColor = (category: QuizCategory) => {
  switch (category) {
    case "programming":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "web":
      return "text-green-600 bg-green-50 border-green-200";
    case "database":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "security":
      return "text-red-600 bg-red-50 border-red-200";
    case "cloud":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "algorithm":
      return "text-indigo-600 bg-indigo-50 border-indigo-200";
    case "devops":
      return "text-cyan-600 bg-cyan-50 border-cyan-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};
