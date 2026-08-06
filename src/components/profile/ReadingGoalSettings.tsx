"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiTarget } from "react-icons/fi";
import { useDailyActivities } from "@/hooks/useDailyActivities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { dailyActivityQueryKey } from "@/utils/dailyActivityUtils";
import { STATISTICS_QUERY_KEY } from "@/utils/profileUtils";
import { isValidReadingGoal } from "@/utils/readingGoalUtils";

export default function ReadingGoalSettings() {
  const { data, date, user, isLoading, isError, refetch } =
    useDailyActivities();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const goal = data?.reading_goal ?? 3;
  const inputGoal = Number(input);
  const isInputValid = input !== "" && isValidReadingGoal(inputGoal);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/daily-activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingGoal: inputGoal }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "읽기 목표를 변경하지 못했습니다.");
      }
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({
        queryKey: dailyActivityQueryKey(user?.id ?? "guest", date),
      });
      queryClient.invalidateQueries({ queryKey: STATISTICS_QUERY_KEY });
    },
  });

  if (isLoading) {
    return (
      <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
        <p className="text-sm text-muted-foreground">
          읽기 목표를 불러오지 못했어요.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <section
      id="reading-goal-settings"
      className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6"
      aria-labelledby="reading-goal-settings-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <FiTarget className="size-4 text-primary" aria-hidden />
          <h2 id="reading-goal-settings-title" className="text-sm font-bold">
            하루 읽기 목표
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="daily-reading-goal" className="sr-only">
            하루 읽기 목표
          </label>
          <Input
            id="daily-reading-goal"
            type="number"
            min={1}
            max={20}
            value={input}
            placeholder={String(goal)}
            onChange={(event) => setInput(event.target.value)}
            className="w-20"
            aria-describedby="daily-reading-goal-hint"
          />
          <span className="text-sm text-muted-foreground">개</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={mutation.isPending || !isInputValid}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "저장 중" : "저장"}
          </Button>
          <span id="daily-reading-goal-hint" className="sr-only">
            1개 이상 20개 이하로 입력하세요.
          </span>
        </div>
      </div>
      {mutation.error && (
        <p className="mt-2 text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
    </section>
  );
}
