"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiHelpCircle } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTE_PATH } from "@/config/constants";
import CsCategoryFilter from "@/components/cs/CsCategoryFilter";
import CsQuestionCard from "@/components/cs/CsQuestionCard";
import { csQuestions } from "@/data/csQuestions";
import { useCsReviews, useSaveCsReview } from "@/hooks/useCsReviews";
import { isCsCategory, type CsCategory } from "@/types/cs";
import {
  filterCsQuestions,
  getCsCategoryLabel,
  toReviewMap,
} from "@/utils/csUtils";

export default function CsQuestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = isCsCategory(categoryParam) ? categoryParam : undefined;

  const reviewsQuery = useCsReviews();
  const saveReview = useSaveCsReview();
  const reviewMap = useMemo(
    () => toReviewMap(reviewsQuery.data ?? []),
    [reviewsQuery.data]
  );

  const questions = useMemo(
    () => filterCsQuestions(csQuestions, category),
    [category]
  );

  const updateCategory = useCallback(
    (nextCategory?: CsCategory) => {
      const params = new URLSearchParams();
      if (nextCategory) params.set("category", nextCategory);
      const query = params.toString();
      router.push(query ? `?${query}` : ROUTE_PATH.CS);
    },
    [router]
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

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FiHelpCircle className="size-8 text-muted-foreground" aria-hidden />
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
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {category
              ? `${getCsCategoryLabel(category)} ${questions.length}문항`
              : `전체 ${questions.length}문항`}
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
