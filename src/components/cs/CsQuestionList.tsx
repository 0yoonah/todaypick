"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiHelpCircle, FiRepeat } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTE_PATH } from "@/config/constants";
import CsCategoryFilter from "@/components/cs/CsCategoryFilter";
import CsQuestionCard from "@/components/cs/CsQuestionCard";
import { csQuestions } from "@/data/csQuestions";
import { isCsCategory, type CsCategory } from "@/types/cs";
import {
  CS_PASS_SCORE,
  CS_REVIEWS_QUERY_KEY,
  filterCsQuestions,
  getCsCategoryLabel,
  selectReviewQuestions,
  toReviewMap,
} from "@/utils/csUtils";
import { useAuthStore } from "@/stores/authStore";
import type { CsReview } from "@/types/cs";

async function fetchCsReviews(): Promise<CsReview[]> {
  const response = await fetch("/api/cs-reviews");
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "채점 기록을 불러오지 못했습니다.");
  }
  return result.reviews ?? [];
}

export default function CsQuestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const categoryParam = searchParams.get("category");
  const category = isCsCategory(categoryParam)
    ? categoryParam
    : undefined;
  const isReviewMode = searchParams.get("mode") === "review";

  const reviewsQuery = useQuery({
    queryKey: CS_REVIEWS_QUERY_KEY,
    queryFn: fetchCsReviews,
    enabled: Boolean(user),
  });
  const reviewMap = useMemo(
    () => toReviewMap(reviewsQuery.data ?? []),
    [reviewsQuery.data]
  );
  const reviewCount = useMemo(
    () => selectReviewQuestions(csQuestions, reviewMap).length,
    [reviewMap]
  );
  const questions = useMemo(() => {
    const filtered = filterCsQuestions(csQuestions, category);
    return isReviewMode
      ? selectReviewQuestions(filtered, reviewMap)
      : filtered;
  }, [category, isReviewMode, reviewMap]);

  const saveReview = useMutation({
    mutationFn: async (input: {
      questionId: string;
      answer: string;
      usedHint: boolean;
    }) => {
      const response = await fetch("/api/cs-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: input.questionId,
          answer: input.answer,
          used_hint: input.usedHint,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "채점 기록을 저장하지 못했습니다.");
      }
      return result.review as CsReview;
    },
    onSuccess: (review) => {
      queryClient.setQueryData<CsReview[]>(CS_REVIEWS_QUERY_KEY, (current) => [
        ...(current ?? []).filter(
          (item) => item.question_id !== review.question_id
        ),
        review,
      ]);
    },
  });

  const updateQuery = useCallback(
    (nextCategory?: CsCategory, nextReviewMode = isReviewMode) => {
      const params = new URLSearchParams();
      if (nextCategory) params.set("category", nextCategory);
      if (nextReviewMode) params.set("mode", "review");
      const query = params.toString();
      router.push(query ? `?${query}` : ROUTE_PATH.CS);
    },
    [router, isReviewMode]
  );

  const updateCategory = useCallback(
    (nextCategory?: CsCategory) => updateQuery(nextCategory),
    [updateQuery]
  );

  return (
    <div>
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-primary">CS 지식</p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          CS 지식 다지기
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          질문을 보고 먼저 스스로 설명해 본 뒤 답을 확인해보세요. 면접에서도
          자주 다루는 주제로 총 {csQuestions.length}개를 준비했어요.
        </p>
      </div>

      <CsCategoryFilter value={category} onChange={updateCategory} />

      {user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {reviewCount > 0
              ? `${CS_PASS_SCORE}점 미만인 질문이 ${reviewCount}개 있어요.`
              : "복습이 필요한 질문이 없어요."}
          </p>
          <Button
            type="button"
            variant={isReviewMode ? "default" : "outline"}
            size="sm"
            aria-pressed={isReviewMode}
            onClick={() => updateQuery(category, !isReviewMode)}
          >
            <FiRepeat aria-hidden />
            {isReviewMode ? "전체 질문 보기" : "복습할 질문만 보기"}
          </Button>
        </div>
      )}

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FiHelpCircle className="size-8 text-muted-foreground" aria-hidden />
            {isReviewMode ? (
              <div>
                <h2 className="font-semibold">
                  {reviewMap.size === 0
                    ? "아직 풀어본 질문이 없어요."
                    : category
                      ? `${getCsCategoryLabel(category)} 분야에는 복습할 질문이 없어요.`
                      : "복습할 질문이 없어요."}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reviewMap.size === 0
                    ? "질문에 답을 쓰고 채점하면 부족한 개념이 여기에 모여요."
                    : `${CS_PASS_SCORE}점 미만으로 채점된 질문이 복습 대상이에요.`}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold">
                  {category
                    ? `${getCsCategoryLabel(category)} 질문이 아직 없어요.`
                    : "질문이 아직 없어요."}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  다른 분야를 선택해보세요.
                </p>
              </div>
            )}
            {isReviewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => updateQuery(category, false)}
              >
                전체 질문 보기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {isReviewMode ? "복습 " : ""}
            {category
              ? `${getCsCategoryLabel(category)} ${questions.length}문항`
              : `${isReviewMode ? "" : "전체 "}${questions.length}문항`}
            {isReviewMode && " · 점수가 낮은 순으로 보여드려요"}
          </p>
          <ul className="space-y-4">
            {questions.map((question) => (
              <li key={question.id}>
                <CsQuestionCard
                  question={question}
                  review={reviewMap.get(question.id)}
                  isSaving={
                    saveReview.isPending &&
                    saveReview.variables?.questionId === question.id
                  }
                  saveError={
                    saveReview.isError &&
                    saveReview.variables?.questionId === question.id
                      ? saveReview.error.message
                      : undefined
                  }
                  onSave={({ answer, usedHint }) =>
                    saveReview.mutate({
                      questionId: question.id,
                      answer,
                      usedHint,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
