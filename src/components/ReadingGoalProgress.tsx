"use client";

import Link from "next/link";
import { FiCheck, FiTarget } from "react-icons/fi";
import { useDailyActivities } from "@/hooks/useDailyActivities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getReadingGoalProgress } from "@/utils/readingGoalUtils";

export default function ReadingGoalProgress() {
  const { data, user, isAuthLoading, isLoading, isError, refetch } =
    useDailyActivities();
  const goal = data?.reading_goal ?? 3;
  const readCount = data?.read_count ?? 0;
  const { isComplete, remaining, percentage } = getReadingGoalProgress(
    readCount,
    goal
  );

  if (isAuthLoading || isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (!user) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold">오늘의 읽기 목표를 만들어보세요</p>
            <p className="mt-1 text-sm text-muted-foreground">
              로그인하면 읽은 글과 목표 달성률이 자동으로 기록돼요.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/login">로그인</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <p className="text-sm">읽기 목표를 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "shadow-none",
        isComplete && "border-success/40 bg-success/5"
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  isComplete
                    ? "bg-success text-white"
                    : "bg-primary/10 text-primary"
                )}
              >
                {isComplete ? <FiCheck aria-hidden /> : <FiTarget aria-hidden />}
              </span>
              <div>
                <h2 className="font-semibold">오늘의 읽기 목표</h2>
                <p className="text-sm text-muted-foreground">
                  {isComplete
                    ? "오늘 목표를 달성했어요!"
                    : `${remaining}개 더 읽으면 달성해요.`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="오늘의 읽기 목표 진행률"
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={Math.min(readCount, goal)}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    isComplete ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <strong className="shrink-0 text-sm">
                {readCount} / {goal}
              </strong>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/profile#reading-goal-settings">프로필에서 변경</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
