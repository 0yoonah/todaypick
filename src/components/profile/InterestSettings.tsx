"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiSliders } from "react-icons/fi";
import { INTERESTS, parseInterestIds, type InterestId } from "@/config/interests";
import { useInterestMutation } from "@/hooks/useInterestMutation";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterestSettings() {
  const { data: profile, isLoading } = useProfileQuery();
  const savedInterests = useMemo(
    () => parseInterestIds(profile?.interests),
    [profile?.interests]
  );

  if (isLoading) {
    return (
      <div className="px-5 py-4 sm:px-6">
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  return <InterestSettingsForm initialInterests={savedInterests} />;
}

function InterestSettingsForm({
  initialInterests,
}: {
  initialInterests: InterestId[];
}) {
  const mutation = useInterestMutation();
  const {
    mutate,
    reset,
    isPending,
    isSuccess,
    error,
  } = mutation;
  const [selected, setSelected] = useState<InterestId[]>(initialInterests);
  const initialKey = [...initialInterests].sort().join(",");
  const selectedKey = [...selected].sort().join(",");

  const toggleInterest = (interest: InterestId) => {
    if (isPending) return;

    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
    reset();
  };

  useEffect(() => {
    if (selectedKey === initialKey || isPending) return;

    const nextInterests = [...selected];
    const timer = window.setTimeout(() => {
      mutate(nextInterests, {
        onError: () => {
          setSelected(initialInterests);
        },
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    initialInterests,
    initialKey,
    isPending,
    mutate,
    selected,
    selectedKey,
  ]);

  return (
    <section
      className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6"
      aria-labelledby="interest-settings-title"
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiSliders className="size-4 text-primary" />
          <h2 id="interest-settings-title" className="text-sm font-bold">
            관심 분야
          </h2>
        </div>
        <span
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {isPending
            ? "저장 중…"
            : isSuccess
              ? "저장됨"
              : error
                ? "저장 실패"
                : ""}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);

          return (
            <button
              key={interest.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isPending}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-1 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait sm:h-8",
                isSelected
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {isSelected && <FiCheck className="size-3" />}
              <span>{interest.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
