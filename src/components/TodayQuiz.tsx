"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCheckCircle } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { getCategoryLabel, getCategoryColor } from "@/utils/quizUtils";
import { Quiz } from "@/types/quiz";
import { PROFILE_TAB, ROUTE_PATH } from "@/config/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TodayQuizResult from "@/components/TodayQuizResult";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { markDailyActivityCompleted } from "@/utils/dailyActivityUtils";

type TodayQuizResponse = {
  quiz: Quiz | null;
  result: { selected_answer: number; is_correct: boolean } | null;
  isCompleted: boolean;
  solvedCount: number;
  totalCount: number;
};

export default function TodayQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let ignore = false;

    const loadQuiz = async () => {
      try {
        // 서버가 이미 푼 문제를 제외하고 오늘의 문제를 결정한다.
        const response = await fetch("/api/quizzes?scope=today");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as TodayQuizResponse;
        if (ignore) return;

        setQuiz(data.quiz);
        setIsCompleted(data.isCompleted);
        setSolvedCount(data.solvedCount);
        setTotalCount(data.totalCount);

        if (data.result) {
          setSelectedAnswer(data.result.selected_answer);
          setIsCorrect(data.result.is_correct);
          setShowResult(true);
        }
      } catch (error) {
        console.error("퀴즈를 불러오는 중 오류가 발생했습니다:", error);
        if (!ignore) setLoadError(true);
      }
    };

    loadQuiz();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = useCallback(async () => {
    if (selectedAnswer === null) return;

    if (!user) {
      router.push(ROUTE_PATH.LOGIN);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "답안 제출에 실패했습니다.");
      }

      const result = await response.json();
      if (!result) return;

      setIsCorrect(result.isCorrect);
      setShowResult(true);
      markDailyActivityCompleted(
        queryClient,
        user.id,
        getSeoulDateKey(),
        "quiz_completed"
      );
    } catch (error) {
      console.error("답안 제출 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "답안 제출에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAnswer, user, router, queryClient]);

  const renderSkeletonCard = useMemo(() => {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-20 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>

          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-[-0.025em] text-foreground">
          오늘의 IT 퀴즈
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          한 문제로 오늘의 IT 상식을 확인해보세요.
          {solvedCount > 0 && totalCount > 0 && (
            <span className="ml-1">
              지금까지 {totalCount}문제 중 {solvedCount}문제를 풀었어요.
            </span>
          )}
        </p>
      </div>

      {loadError ? (
        <Card className="w-full shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <h3 className="font-semibold">퀴즈를 불러오지 못했습니다.</h3>
            <p className="text-sm text-muted-foreground">
              잠시 후 다시 시도해주세요.
            </p>
          </CardContent>
        </Card>
      ) : isCompleted ? (
        <Card className="w-full shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FiCheckCircle className="size-8 text-success" aria-hidden />
            <div>
              <h3 className="font-semibold">
                준비된 퀴즈를 모두 풀었어요.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                총 {totalCount}문제를 완주했습니다. 새로운 문제가 추가되면 이곳에
                다시 나타나요.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`${ROUTE_PATH.PROFILE}?tab=${PROFILE_TAB.QUIZ_RECORDS}`}>
                퀴즈 기록 보기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : !quiz ? (
        renderSkeletonCard
      ) : (
        <Card className="w-full shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
                  getCategoryColor(quiz.category)
                )}
              >
                {getCategoryLabel(quiz.category)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 문제 */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {quiz.question}
              </h3>
            </div>

            {/* 선택지 */}
            <div className="space-y-3">
              {quiz.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = quiz.correct_answer === index;
                const isWrong =
                  selectedAnswer !== null &&
                  selectedAnswer === index &&
                  !isCorrectAnswer;

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && handleAnswerSelect(index)}
                    disabled={showResult}
                    className={cn(
                      "w-full cursor-pointer rounded-lg border p-4 text-left transition-colors duration-150 disabled:cursor-default",
                      showResult
                        ? isCorrectAnswer
                          ? "border-correct bg-correct/10 text-correct"
                          : isWrong
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border bg-muted/50 text-muted-foreground"
                        : isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-border/60 hover:bg-muted/50"
                    )}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + index)}.
                    </span>{" "}
                    {option}
                  </button>
                );
              })}
            </div>

            {!showResult && selectedAnswer !== null && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-11 w-full"
              >
                {isSubmitting ? "제출 중..." : "답안 제출"}
              </Button>
            )}

            {/* 결과 표시 */}
            {showResult && (
              <TodayQuizResult isCorrect={isCorrect} quiz={quiz} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
