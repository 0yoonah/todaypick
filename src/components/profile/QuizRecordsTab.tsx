"use client";

import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Quiz, QuizResult } from "@/types/quiz";
import { getCategoryLabel, getCategoryColor } from "@/utils/quizUtils";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizRecordWithInfo extends QuizResult {
  quiz: Quiz | null;
}

export default function QuizRecordsTab() {
  const [records, setRecords] = useState<QuizRecordWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchQuizRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/quizzes");

        if (!response.ok) {
          throw new Error("퀴즈 기록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizRecords();
  }, []);

  const formatDate = (dateString: string) => {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(dateString));
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";

    return `${getPart("year")}.${getPart("month")}.${getPart("day")}`;
  };

  const getScoreColor = (isCorrect: boolean) => {
    return isCorrect
      ? "border-correct/25 bg-correct/10 text-correct"
      : "border-destructive/25 bg-destructive/10 text-destructive";
  };

  const toggleExpanded = (recordId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedItems(newExpanded);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">아직 푼 퀴즈가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {records.map((record) => {
          const isExpanded = expandedItems.has(record.id);

          return (
            <Card
              key={record.id}
              className="overflow-hidden transition-colors hover:border-primary/30"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(record.id)}
                aria-expanded={isExpanded}
                className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center space-x-2">
                      {record.quiz && (
                        <Badge
                          className={cn(
                            "text-xs font-medium border max-[360px]:hidden",
                            getCategoryColor(record.quiz.category)
                          )}
                        >
                          {getCategoryLabel(record.quiz.category)}
                        </Badge>
                      )}
                      <span className="truncate text-sm text-muted-foreground">
                        {formatDate(record.answered_at)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium border",
                          getScoreColor(record.is_correct)
                        )}
                      >
                        {record.is_correct ? "정답" : "오답"}
                      </Badge>
                      {isExpanded ? (
                        <FiChevronUp
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                      ) : (
                        <FiChevronDown
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  {record.quiz ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {record.quiz.question}
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          선택한 답:{" "}
                          <span
                            className={cn(
                              "font-medium",
                              record.is_correct
                                ? "text-correct"
                                : "text-destructive"
                            )}
                          >
                            {String.fromCharCode(65 + record.selected_answer)}.{" "}
                            {record.quiz.options[record.selected_answer]}
                          </span>
                        </p>
                        <p>
                          정답:{" "}
                          <span className="font-medium text-correct">
                            {String.fromCharCode(
                              65 + record.quiz.correct_answer
                            )}
                            . {record.quiz.options[record.quiz.correct_answer]}
                          </span>
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h5 className="font-medium text-sm mb-2 text-foreground">
                              해설
                            </h5>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {record.quiz.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      퀴즈 정보를 불러올 수 없습니다.
                    </p>
                  )}
                </CardContent>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
