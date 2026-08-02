"use client";

import Link from "next/link";
import { FiBookOpen, FiCheck, FiMessageCircle, FiTarget } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyActivities } from "@/hooks/useDailyActivities";
import { cn } from "@/lib/utils";
import type { DailyChecklistItem } from "@/types/dailyActivity";
import {
  EMPTY_DAILY_ACTIVITY,
  getCompletedActivityCount,
} from "@/utils/dailyActivityUtils";

const CHECKLIST_ITEMS: DailyChecklistItem[] = [
  {
    activity: "feed_clicked",
    title: "IT 피드 읽기",
    description: "오늘의 콘텐츠 하나 살펴보기",
    href: "#today-feed",
  },
  {
    activity: "quiz_completed",
    title: "퀴즈 완료",
    description: "오늘의 IT 퀴즈에 답하기",
    href: "#today-quiz",
  },
  {
    activity: "quote_viewed",
    title: "명언 확인",
    description: "오늘의 한 문장으로 마무리하기",
    href: "#today-quote",
  },
];

const ITEM_ICONS = [FiBookOpen, FiTarget, FiMessageCircle];

export default function DailyLearningChecklist() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    user,
    isAuthLoading,
  } = useDailyActivities();
  const state = data ?? EMPTY_DAILY_ACTIVITY;
  const completedCount = getCompletedActivityCount(state);
  const isComplete = completedCount === CHECKLIST_ITEMS.length;
  const progress = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  if (isAuthLoading) {
    return <ChecklistSkeleton />;
  }

  if (!user) {
    return (
      <Card className="overflow-hidden border-0 bg-secondary shadow-none">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">오늘의 학습</p>
            <h1 className="text-xl font-bold leading-snug tracking-[-0.025em] sm:text-2xl">
              오늘 알아둘 내용을 준비했어요
            </h1>
            <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block">
              로그인하면 피드, 퀴즈, 명언 활동이 자동으로 기록되고 오늘의
              진행률을 확인할 수 있어요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ChecklistSkeleton />;
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold">학습 현황을 불러오지 못했어요</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              잠시 후 다시 시도해주세요.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            다시 불러오기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="daily-checklist-title">
      <Card
        className={cn(
          "overflow-hidden border-0 bg-secondary shadow-none transition-colors",
          isComplete && "border-success/40 bg-success/5"
        )}
      >
        <CardContent className="p-6 sm:p-8">
          <div>
            <div>
              <p className="text-sm font-semibold text-primary">오늘의 학습</p>
              <h1
                id="daily-checklist-title"
                className="mt-1 text-xl font-bold tracking-[-0.025em] sm:text-2xl"
              >
                {isComplete
                  ? "오늘의 학습을 모두 완료했어요!"
                  : "오늘의 학습 체크리스트"}
              </h1>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                {isComplete
                  ? "작은 학습을 모두 해낸 멋진 하루예요. 내일도 이어가요."
                  : "세 가지 활동을 완료하고 오늘의 루틴을 채워보세요."}
              </p>
            </div>
          </div>

          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted sm:mt-5 sm:h-2"
            role="progressbar"
            aria-label="오늘의 학습 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                isComplete ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 divide-y border-t md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
            {CHECKLIST_ITEMS.map((item, index) => {
              const isChecked = state[item.activity];
              const Icon = ITEM_ICONS[index];

              return (
                <Link
                  key={item.activity}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-1 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:py-4 md:px-4",
                    isChecked
                      ? "text-success"
                      : "hover:text-primary"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
                      isChecked
                        ? "bg-success text-white"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {isChecked ? <FiCheck /> : <Icon />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold sm:text-base">
                      {item.title}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {isChecked ? "완료했어요" : item.description}
                    </span>
                  </span>
                  {item.activity === "feed_clicked" && (
                    <span
                      className={cn(
                        "ml-auto shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                        isChecked
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary"
                      )}
                      aria-label={`오늘 ${state.read_count ?? 0}개 읽음, 목표 ${state.reading_goal ?? 3}개`}
                    >
                      {state.read_count ?? 0}/{state.reading_goal ?? 3}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ChecklistSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl sm:h-20" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
