"use client";

import { useState } from "react";
import { FiCheck, FiSliders } from "react-icons/fi";
import { INTERESTS, parseInterestIds, type InterestId } from "@/config/interests";
import { useInterestMutation } from "@/hooks/useInterestMutation";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterestSettings() {
  const { data: profile, isLoading } = useProfileQuery();
  const savedInterests = parseInterestIds(profile?.interests);

  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  return (
    <InterestSettingsForm
      key={savedInterests.slice().sort().join(",")}
      initialInterests={savedInterests}
    />
  );
}

function InterestSettingsForm({
  initialInterests,
}: {
  initialInterests: InterestId[];
}) {
  const mutation = useInterestMutation();
  const [selected, setSelected] =
    useState<InterestId[]>(initialInterests);

  const toggleInterest = (interest: InterestId) => {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
    mutation.reset();
  };

  const hasChanges =
    [...selected].sort().join(",") !==
    [...initialInterests].sort().join(",");

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FiSliders className="text-primary" />
              <h2 className="text-lg font-bold">관심 분야</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              여러 분야를 선택하면 관련 콘텐츠를 최신 피드 안에서 먼저
              보여드려요.
            </p>
          </div>
          <Button
            onClick={() => mutation.mutate(selected)}
            disabled={!hasChanges || mutation.isPending}
            className="shrink-0"
          >
            {mutation.isPending ? "저장 중..." : "관심 분야 저장"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest.id);

            return (
              <button
                key={interest.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleInterest(interest.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && <FiCheck className="size-3" />}
                </span>
                <span>
                  <span className="block font-semibold">{interest.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {interest.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {mutation.isSuccess && (
          <p className="mt-4 text-sm text-success" role="status">
            관심 분야를 저장했어요. 피드 우선순위에 바로 반영됩니다.
          </p>
        )}
        {mutation.error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {mutation.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
