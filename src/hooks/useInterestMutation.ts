"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InterestId } from "@/config/interests";

export function useInterestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interests: InterestId[]) => {
      const response = await fetch("/api/profile/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "관심 분야를 저장하지 못했습니다.");
      }

      return data as { interests: InterestId[] };
    },
    onSuccess: async ({ interests }) => {
      queryClient.setQueryData(["profile"], (profile: unknown) =>
        profile && typeof profile === "object"
          ? { ...profile, interests }
          : profile
      );
      await queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
