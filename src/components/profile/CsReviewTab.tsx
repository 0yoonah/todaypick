"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FiCheckCircle, FiHelpCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CsQuestionCard from "@/components/cs/CsQuestionCard";
import { ROUTE_PATH } from "@/config/constants";
import { useCsReviews, useSaveCsReview } from "@/hooks/useCsReviews";
import CsProgressSummary from "@/components/profile/CsProgressSummary";
import { CS_PASS_SCORE, toReviewMap } from "@/utils/csUtils";

export default function CsReviewTab() {
  const reviewsQuery = useCsReviews();
  const saveReview = useSaveCsReview();

  // 복습 목록과 진도는 서버에서 계산해 내려준다.
  const reviewMap = useMemo(
    () => toReviewMap(reviewsQuery.data?.reviews ?? []),
    [reviewsQuery.data],
  );
  const reviewQuestions = reviewsQuery.data?.reviewQuestions ?? [];
  const summary = reviewsQuery.data?.progress;

  if (reviewsQuery.isLoading) {
    return (
      <div className="space-y-4" aria-label="복습할 질문을 불러오는 중">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h2 className="font-semibold">
              복습할 질문을 불러오지 못했습니다.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviewsQuery.error.message}
            </p>
          </div>
          <Button variant="outline" onClick={() => void reviewsQuery.refetch()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (reviewMap.size === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <FiHelpCircle className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-semibold">아직 풀어본 질문이 없어요.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              질문에 답을 쓰고 채점하면 부족했던 개념이 여기에 모여요.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTE_PATH.CS}>CS 지식 질문 풀어보기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (reviewQuestions.length === 0) {
    return (
      <div>
        {summary && <CsProgressSummary summary={summary} />}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FiCheckCircle className="size-8 text-success" aria-hidden />
            <div>
              <h2 className="font-semibold">복습할 질문이 없어요.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                풀어본 질문 {reviewMap.size}개가 모두 {CS_PASS_SCORE}점
                이상이에요.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={ROUTE_PATH.CS}>새로운 질문 풀어보기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {summary && <CsProgressSummary summary={summary} />}

      <div className="mb-4">
        <h2 className="font-bold">
          복습이 필요한 질문 {reviewQuestions.length}개
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {CS_PASS_SCORE}점 미만으로 채점된 질문이에요. 점수가 낮은 순으로
          보여드려요. 다시 풀어 {CS_PASS_SCORE}점을 넘으면 목록에서 빠집니다.
        </p>
      </div>

      <ul className="space-y-4">
        {reviewQuestions.map((question) => (
          <li key={question.id}>
            <CsQuestionCard
              question={question}
              review={reviewMap.get(question.id)}
              keywordLinks={reviewsQuery.data?.keywordLinks}
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
              onSave={({ answer }) =>
                saveReview.mutate({ questionId: question.id, answer })
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
