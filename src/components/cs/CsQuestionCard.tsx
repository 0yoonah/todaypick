"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiEye, FiHelpCircle, FiRotateCcw, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import type { CsGradeResult, CsQuestion, CsReview } from "@/types/cs";
import {
  CS_PASS_SCORE,
  getCsCategoryColor,
  getCsCategoryLabel,
  getScoreFeedback,
  gradeCsAnswer,
  MAX_CS_ANSWER_LENGTH,
  restoreGradeResult,
} from "@/utils/csUtils";

interface CsQuestionCardProps {
  question: CsQuestion;
  /** 저장된 지난 채점 기록 */
  review?: CsReview;
  onSave?: (input: { answer: string; usedHint: boolean }) => void;
  isSaving?: boolean;
  saveError?: string;
}

export default function CsQuestionCard({
  question,
  review,
  onSave,
  isSaving = false,
  saveError,
}: CsQuestionCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const savedResult = review
    ? restoreGradeResult(question.keywords, review.matched_keywords, review.score)
    : null;

  const [answer, setAnswer] = useState(review?.answer ?? "");
  const [result, setResult] = useState<CsGradeResult | null>(savedResult);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedHint, setUsedHint] = useState(review?.used_hint ?? false);

  const answerId = useId();
  const hintId = useId();
  const modelAnswerId = useId();

  const handleGrade = () => {
    if (!user) {
      router.push(ROUTE_PATH.LOGIN);
      return;
    }

    setResult(gradeCsAnswer(answer, question.keywords));
    setShowAnswer(true);
    onSave?.({ answer, usedHint });
  };

  const handleReset = () => {
    setAnswer("");
    setResult(null);
    setShowHint(false);
    setShowAnswer(false);
    setUsedHint(false);
  };

  const handleShowHint = () => {
    setShowHint((current) => !current);
    setUsedHint(true);
  };

  return (
    <Card id={question.id} className="w-full scroll-mt-24 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
              getCsCategoryColor(question.category)
            )}
          >
            {getCsCategoryLabel(question.category)}
          </span>
          {usedHint && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              힌트 사용
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold leading-relaxed text-card-foreground sm:text-lg">
          {question.question}
        </h2>

        <div className="mt-4">
          <label htmlFor={answerId} className="sr-only">
            {question.question} 답변 작성
          </label>
          <textarea
            id={answerId}
            value={answer}
            maxLength={MAX_CS_ANSWER_LENGTH}
            disabled={Boolean(result)}
            placeholder="먼저 스스로 설명해보세요. 떠오르는 개념을 자유롭게 적으면 됩니다."
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-32 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted/40 disabled:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShowHint}
            aria-expanded={showHint}
            aria-controls={hintId}
          >
            <FiHelpCircle aria-hidden />
            {showHint ? "힌트 접기" : "힌트 보기"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAnswer((current) => !current)}
            aria-expanded={showAnswer}
            aria-controls={modelAnswerId}
          >
            <FiEye aria-hidden />
            {showAnswer ? "모범 답안 접기" : "모범 답안 보기"}
          </Button>
          {result ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={handleReset}
            >
              <FiRotateCcw aria-hidden />
              다시 풀기
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={answer.trim().length === 0 || isSaving}
              onClick={handleGrade}
            >
              {isSaving ? "채점 중..." : "채점하기"}
            </Button>
          )}
        </div>

        {showHint && (
          <div id={hintId} className="mt-4 rounded-xl bg-muted/50 p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              이 개념들을 언급해보세요
            </p>
            <ul className="flex flex-wrap gap-2">
              {question.keywords.map((keyword) => (
                <li
                  key={keyword}
                  className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  {keyword}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div
            className="mt-4 rounded-xl border p-4"
            role="status"
            aria-live="polite"
          >
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={cn(
                  "text-2xl font-bold",
                  result.score >= CS_PASS_SCORE ? "text-success" : "text-destructive"
                )}
              >
                {result.score}점
              </span>
              <span className="text-sm text-muted-foreground">
                키워드 {result.total}개 중 {result.matched.length}개 언급
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {getScoreFeedback(result.score)}
            </p>
            <ul className="flex flex-wrap gap-2">
              {result.matched.map((keyword) => (
                <li
                  key={keyword}
                  className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success"
                >
                  <FiCheck className="size-3" aria-hidden />
                  <span className="sr-only">언급함: </span>
                  {keyword}
                </li>
              ))}
              {result.missed.map((keyword) => (
                <li
                  key={keyword}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  <FiX className="size-3" aria-hidden />
                  <span className="sr-only">놓침: </span>
                  {keyword}
                </li>
              ))}
            </ul>
            {saveError && (
              <p className="mt-3 text-xs text-destructive">{saveError}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              키워드 언급 여부로 계산한 참고 점수예요. 표현이 달라 인식되지 않을 수
              있으니 모범 답안과 함께 확인해보세요.
            </p>
          </div>
        )}

        {showAnswer && (
          <div id={modelAnswerId} className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              모범 답안
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {question.answer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
