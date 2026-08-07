"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { markDailyActivityCompleted } from "@/utils/dailyActivityUtils";
import { CS_REVIEWS_QUERY_KEY } from "@/utils/csUtils";
import type { CsProgressSummary } from "@/utils/csUtils";
import type { CsQuestion, CsReview } from "@/types/cs";

export interface CsReviewsResponse {
  /** 사용자가 채점한 기록 */
  reviews: CsReview[];
  /** 복습이 필요한 문항. 문항 데이터를 번들에 싣지 않도록 서버가 골라 준다. */
  reviewQuestions: CsQuestion[];
  /** 분야별 진도 집계 */
  progress: CsProgressSummary;
}

async function fetchCsReviews(): Promise<CsReviewsResponse> {
  const response = await fetch("/api/cs-reviews");
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "채점 기록을 불러오지 못했습니다.");
  }
  return result as CsReviewsResponse;
}

/** 로그인한 사용자의 CS 지식 채점 기록과 복습 목록 */
export function useCsReviews() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: CS_REVIEWS_QUERY_KEY,
    queryFn: fetchCsReviews,
    enabled: Boolean(user),
  });
}

export interface SaveCsReviewInput {
  questionId: string;
  answer: string;
  usedHint: boolean;
}

/**
 * 채점 결과를 저장한다.
 * 점수는 서버가 다시 계산하므로 응답으로 캐시를 갱신하고,
 * 복습 목록과 진도는 서버가 계산하므로 다시 불러온다.
 */
export function useSaveCsReview() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (input: SaveCsReviewInput) => {
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
      queryClient.setQueryData<CsReviewsResponse>(
        CS_REVIEWS_QUERY_KEY,
        (current) =>
          current
            ? {
                ...current,
                reviews: [
                  ...current.reviews.filter(
                    (item) => item.question_id !== review.question_id
                  ),
                  review,
                ],
              }
            : current
      );
      void queryClient.invalidateQueries({ queryKey: CS_REVIEWS_QUERY_KEY });

      if (user) {
        markDailyActivityCompleted(
          queryClient,
          user.id,
          getSeoulDateKey(),
          "cs_completed"
        );
      }
    },
  });
}
