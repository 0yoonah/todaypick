"use client";

import { cn } from "@/lib/utils";
import {
  getCsCategoryLabel,
  type CsProgressSummary as CsProgressSummaryData,
} from "@/utils/csUtils";

interface CsProgressSummaryProps {
  summary: CsProgressSummaryData;
}

export default function CsProgressSummary({ summary }: CsProgressSummaryProps) {
  const percentage =
    summary.total === 0 ? 0 : Math.round((summary.solved / summary.total) * 100);

  return (
    <section className="mb-6" aria-labelledby="cs-progress-title">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="cs-progress-title" className="text-sm font-bold">
          학습 진행 상황
        </h2>
        <p className="text-xs text-muted-foreground">
          {summary.solved}/{summary.total}
          {summary.solved > 0 && ` · 평균 ${summary.averageScore}점`}
          {summary.needsReviewCount > 0 &&
            ` · 복습 ${summary.needsReviewCount}개`}
        </p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
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

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {summary.byCategory.map((progress) => (
          <li
            key={progress.category}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs",
              progress.solved === 0
                ? "border-border text-muted-foreground"
                : progress.needsReviewCount > 0
                  ? "border-warning/40 bg-warning/10 text-foreground"
                  : "border-success/30 bg-success/10 text-success"
            )}
          >
            {getCsCategoryLabel(progress.category)} {progress.solved}/
            {progress.total}
            {progress.needsReviewCount > 0 && (
              <span className="ml-1 font-medium">
                복습 {progress.needsReviewCount}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
