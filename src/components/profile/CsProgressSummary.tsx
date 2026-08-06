"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CS_PASS_SCORE,
  getCsCategoryLabel,
  type CsProgressSummary as CsProgressSummaryData,
} from "@/utils/csUtils";

interface CsProgressSummaryProps {
  summary: CsProgressSummaryData;
}

const toPercentage = (solved: number, total: number) =>
  total === 0 ? 0 : Math.round((solved / total) * 100);

export default function CsProgressSummary({ summary }: CsProgressSummaryProps) {
  const percentage = toPercentage(summary.solved, summary.total);

  return (
    <Card className="mb-6">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-bold">학습 진행 상황</h2>
          <p className="text-sm text-muted-foreground">
            평균 {summary.averageScore}점 · 복습 필요 {summary.needsReviewCount}개
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="CS 지식 학습 진행률"
            aria-valuemin={0}
            aria-valuemax={summary.total}
            aria-valuenow={summary.solved}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <strong className="shrink-0 text-sm">
            {summary.solved} / {summary.total}
          </strong>
        </div>

        <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {summary.byCategory.map((progress) => {
            const categoryPercentage = toPercentage(
              progress.solved,
              progress.total
            );

            return (
              <li key={progress.category}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {getCsCategoryLabel(progress.category)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {progress.solved}/{progress.total}
                    {progress.solved > 0 && ` · 평균 ${progress.averageScore}점`}
                    {progress.needsReviewCount > 0 &&
                      ` · 복습 ${progress.needsReviewCount}개`}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`${getCsCategoryLabel(progress.category)} 진행률`}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-valuenow={progress.solved}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
                      progress.solved === 0
                        ? "bg-transparent"
                        : progress.needsReviewCount > 0
                          ? "bg-warning"
                          : "bg-success"
                    )}
                    style={{ width: `${categoryPercentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          {CS_PASS_SCORE}점 미만으로 채점된 질문을 복습 대상으로 봐요.
        </p>
      </CardContent>
    </Card>
  );
}
