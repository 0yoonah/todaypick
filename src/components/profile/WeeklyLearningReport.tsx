import {
  FiArrowDown,
  FiArrowRight,
  FiArrowUp,
  FiBookOpen,
  FiCalendar,
  FiTarget,
} from "react-icons/fi";
import { INTERESTS } from "@/config/interests";
import { cn } from "@/lib/utils";
import type {
  WeeklyReportComparison,
  WeeklyReportSummary,
} from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyLearningReportProps {
  current: WeeklyReportSummary;
  comparison: WeeklyReportComparison;
}

export default function WeeklyLearningReport({
  current,
  comparison,
}: WeeklyLearningReportProps) {
  const topInterest = INTERESTS.find(({ id }) => id === current.topInterest);
  const hasActivity =
    current.learningDays > 0 ||
    current.quizzesCompleted > 0 ||
    current.feedsEngaged > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FiCalendar className="text-primary" />
            이번 주 학습 리포트
          </CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDateKey(current.startDate)}–{formatDateKey(current.endDate)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 max-[360px]:grid-cols-1 sm:gap-4">
          <ReportMetric
            icon={FiCalendar}
            label="학습일"
            value={`${current.learningDays}일`}
            delta={comparison.learningDays}
          />
          <ReportMetric
            icon={FiTarget}
            label="완료한 퀴즈"
            mobileLabel="퀴즈"
            value={`${current.quizzesCompleted}개`}
            subtext={`정답률 ${current.accuracyRate}%`}
            delta={comparison.quizzesCompleted}
          />
          <ReportMetric
            icon={FiBookOpen}
            label="읽거나 저장한 피드"
            mobileLabel="피드"
            value={`${current.feedsEngaged}개`}
            subtext={`읽기 ${current.feedReads} · 저장 ${current.feedsScraped}`}
            delta={comparison.feedsEngaged}
          />
        </div>

        <div className="mt-4 rounded-lg border bg-muted/30 p-3 sm:mt-5 sm:rounded-xl sm:p-4">
          {hasActivity ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {topInterest
                    ? `이번 주에는 ${topInterest.label} 분야를 가장 많이 학습했어요`
                    : `${current.completedGoalDays}일 동안 하루 목표를 모두 완료했어요`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getRecommendation(current)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                목표 완료 {current.completedGoalDays}일
              </span>
            </div>
          ) : (
            <div>
              <p className="font-semibold">아직 이번 주 학습 기록이 없어요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                오늘 피드 하나를 읽는 것부터 가볍게 시작해보세요. 첫 활동이
                주간 리포트에 바로 반영됩니다.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  mobileLabel,
  value,
  subtext,
  delta,
}: {
  icon: typeof FiCalendar;
  label: string;
  mobileLabel?: string;
  value: string;
  subtext?: string;
  delta: number;
}) {
  const DeltaIcon = delta > 0 ? FiArrowUp : delta < 0 ? FiArrowDown : FiArrowRight;

  return (
    <div className="min-w-0 rounded-lg border p-3 sm:rounded-xl sm:p-4">
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
          <Icon className="size-3.5 shrink-0 text-primary sm:size-4" />
          <span className="truncate sm:hidden">{mobileLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 text-xs font-medium sm:gap-1",
            delta > 0
              ? "text-success"
              : delta < 0
                ? "text-destructive"
                : "text-muted-foreground"
          )}
          aria-label={`지난주 대비 ${delta}`}
        >
          <DeltaIcon />
          {delta > 0 ? `+${delta}` : delta}
        </span>
      </div>
      <div className="mt-2 min-w-0">
        <p className="text-xl font-bold sm:text-2xl">{value}</p>
        {subtext && (
          <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:mt-0.5 sm:text-xs">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDateKey(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function getRecommendation(report: WeeklyReportSummary) {
  if (report.learningDays < 3) {
    return "다음 주에는 3일 학습을 목표로 잡아 꾸준한 리듬을 만들어보세요.";
  }
  if (report.completedGoalDays === 0) {
    return "하루를 골라 피드·퀴즈·명언 세 가지 목표를 모두 완료해보세요.";
  }
  return "좋은 흐름이에요. 다음 주에는 이번 주보다 학습일을 하루 더 늘려보세요.";
}
