"use client";

import { FiCalendar } from "react-icons/fi";
import { LearningStatistics } from "@/types/auth";
import { cn } from "@/lib/utils";
import {
  getCurrentWeekDates,
  getCurrentWeekLabel,
  getLearningProgressByDate,
  getCompletedActivitiesCount,
  getProgressPercentage,
  isToday,
  getDayName,
  getFormattedDate,
} from "@/utils/profileUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CircularProgressbar from "@/components/CircularProgressbar";

interface WeeklyLearningProgressProps {
  statistics: LearningStatistics;
}

export default function WeeklyLearningProgress({
  statistics,
}: WeeklyLearningProgressProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <FiCalendar className="h-5 w-5" />
          <span>{getCurrentWeekLabel()} 학습 현황</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="grid w-max grid-cols-7 gap-3 sm:w-full sm:gap-4 lg:gap-4">
            {getCurrentWeekDates().map((date) => {
              const dailyProgress = getLearningProgressByDate(date, statistics);
              const completedActivities =
                getCompletedActivitiesCount(dailyProgress);

              return (
                <div
                  key={date.toISOString()}
                  className="w-16 text-center sm:w-auto"
                >
                  <div
                    className={cn(
                      "mb-2 flex flex-col items-center text-xs",
                      isToday(date)
                        ? "font-bold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>{getDayName(date)}</span>
                    <span>{getFormattedDate(date)}</span>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <CircularProgressbar
                      value={getProgressPercentage(completedActivities)}
                      size={80}
                      strokeWidth={6}
                      color={
                        completedActivities === 3
                          ? "var(--success)"
                          : "var(--primary)"
                      }
                      backgroundColor="var(--muted)"
                      showValue={false}
                      className="[&_svg]:size-16 sm:[&_svg]:size-20"
                    >
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {completedActivities}
                        </div>
                        <div className="text-xs text-muted-foreground">/3</div>
                      </div>
                    </CircularProgressbar>

                    <div className="flex space-x-1">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          dailyProgress.feedClick ? "bg-primary" : "bg-muted"
                        )}
                      />
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          dailyProgress.quizComplete
                            ? "bg-success"
                            : "bg-muted"
                        )}
                      />
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          dailyProgress.quoteView
                            ? "bg-info"
                            : "bg-muted"
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4 sm:mt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:gap-x-6">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>피드 확인</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span>퀴즈 풀기</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-info" />
              <span>명언 확인</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
