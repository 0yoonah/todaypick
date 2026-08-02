"use client";

import { useState, useEffect } from "react";
import { FiTrendingUp, FiTarget } from "react-icons/fi";
import { LearningStatistics } from "@/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonLearningStatisticsTab from "@/components/profile/SkeletonLearningStatisticsTab";
import WeeklyLearningProgress from "@/components/profile/WeeklyLearningProgress";
import WeeklyLearningReport from "@/components/profile/WeeklyLearningReport";

export default function LearningStatisticsTab() {
  const [statistics, setStatistics] = useState<LearningStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("/api/statistics");
        if (!response.ok) {
          throw new Error("통계를 불러오는데 실패했습니다.");
        }
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("통계 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) return <SkeletonLearningStatisticsTab />;

  if (!statistics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">통계를 불러올 수 없습니다.</p>
      </div>
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
