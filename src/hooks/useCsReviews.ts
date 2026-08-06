"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { CS_REVIEWS_QUERY_KEY } from "@/utils/csUtils";
import type { CsReview } from "@/types/cs";

async function fetchCsReviews(): Promise<CsReview[]> {
  const response = await fetch("/api/cs-reviews");
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "채점 기록을 불러오지 못했습니다.");
  }
  return result.reviews ?? [];
}

/** 로그인한 사용자의 CS 지식 채점 기록 */
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
 * 점수는 서버가 다시 계산하므로 응답으로 캐시를 갱신한다.
 */
export function useSaveCsReview() {
  const queryClient = useQueryClient();

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
      queryClient.setQueryData<CsReview[]>(CS_REVIEWS_QUERY_KEY, (current) => [
        ...(current ?? []).filter(
          (item) => item.question_id !== review.question_id
        ),
        review,
      ]);
    },
  });
}
