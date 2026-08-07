"use client";

import { useMemo } from "react";
import CsQuestionCard from "@/components/cs/CsQuestionCard";
import { useCsReviews, useSaveCsReview } from "@/hooks/useCsReviews";
import { toReviewMap } from "@/utils/csUtils";
import type { CsQuestion } from "@/types/cs";
import type { GlossaryKeywordLink } from "@/utils/glossaryUtils";

interface CsQuestionListProps {
  /** 서버에서 분야 필터를 적용해 넘겨준 문항 */
  questions: CsQuestion[];
  /** 채점 결과 키워드에 붙일 용어사전 링크 */
  keywordLinks?: Record<string, GlossaryKeywordLink>;
}

/**
 * 채점 기록 조회와 저장만 클라이언트에서 담당한다.
 * 문항 데이터는 서버에서 props로 받아 클라이언트 번들에 싣지 않는다.
 */
export default function CsQuestionList({
  questions,
  keywordLinks,
}: CsQuestionListProps) {
  const reviewsQuery = useCsReviews();
  const saveReview = useSaveCsReview();
  const reviewMap = useMemo(
    () => toReviewMap(reviewsQuery.data?.reviews ?? []),
    [reviewsQuery.data]
  );

  return (
    <ul className="space-y-4">
      {questions.map((question) => (
        <li key={question.id}>
          <CsQuestionCard
            question={question}
            review={reviewMap.get(question.id)}
            keywordLinks={keywordLinks}
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
  );
}
