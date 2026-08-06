"use client";

import { useQuery } from "@tanstack/react-query";
import { FiTrendingUp, FiTarget } from "react-icons/fi";
import { LearningStatistics } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonLearningStatisticsTab from "@/components/profile/SkeletonLearningStatisticsTab";
import WeeklyLearningProgress from "@/components/profile/WeeklyLearningProgress";
import WeeklyLearningReport from "@/components/profile/WeeklyLearningReport";
import { STATISTICS_QUERY_KEY } from "@/utils/profileUtils";

async function fetchStatistics(): Promise<LearningStatistics> {
  const response = await fetch("/api/statistics");
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || "통계를 불러오지 못했습니다.");
  }

  return result as LearningStatistics;
}

export default function LearningStatisticsTab() {
  const {
    data: statistics,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: STATISTICS_QUERY_KEY,
    queryFn: fetchStatistics,
    retry: 1,
  });

  if (isLoading) return <SkeletonLearningStatisticsTab />;

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h2 className="font-semibold">통계를 불러오지 못했습니다.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "불러오는 중..." : "다시 시도"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <h2 className="font-semibold">아직 학습 기록이 없습니다.</h2>
          <p className="text-sm text-muted-foreground">
            피드를 읽고 퀴즈를 풀면 여기에 통계가 쌓여요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <WeeklyLearningReport
        current={statistics.weeklyReport.current}
        comparison={statistics.weeklyReport.comparison}
      />

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-2 flex items-center space-x-2">
              <FiTarget className="size-5 text-primary sm:size-6" />
              <span className="text-sm font-medium text-muted-foreground">
                총 퀴즈
              </span>
            </div>
            <div className="text-xl font-bold sm:text-2xl">
              {statistics.totalQuizzes}
            </div>
            <div className="text-xs text-muted-foreground">
              정답률 {statistics.accuracyRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-2 flex items-center space-x-2">
              <FiTrendingUp className="size-5 text-success sm:size-6" />
              <span className="text-sm font-medium text-muted-foreground">
                목표 달성 스트릭
              </span>
            </div>
            <div className="text-xl font-bold sm:text-2xl">
              {statistics.currentStreak}일
            </div>
            <div className="text-xs text-muted-foreground">
              최고 {statistics.longestStreak}일
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주간 학습 현황 */}
      <WeeklyLearningProgress statistics={statistics} />
    </div>
  );
}
