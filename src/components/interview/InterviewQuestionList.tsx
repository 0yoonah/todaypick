"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiHelpCircle } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import InterviewCategoryFilter from "@/components/interview/InterviewCategoryFilter";
import InterviewQuestionCard from "@/components/interview/InterviewQuestionCard";
import { interviewQuestions } from "@/data/interviewQuestions";
import { isInterviewCategory, type InterviewCategory } from "@/types/interview";
import {
  filterInterviewQuestions,
  getInterviewCategoryLabel,
} from "@/utils/interviewUtils";

export default function InterviewQuestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = isInterviewCategory(categoryParam)
    ? categoryParam
    : undefined;

  const questions = useMemo(
    () => filterInterviewQuestions(interviewQuestions, category),
    [category]
  );

  const updateCategory = useCallback(
    (nextCategory?: InterviewCategory) => {
      const params = new URLSearchParams();
      if (nextCategory) params.set("category", nextCategory);
      const query = params.toString();
      router.push(query ? `?${query}` : "/interview");
    },
    [router]
  );

  return (
    <div>
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-primary">면접 대비</p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          CS 면접 질문
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          질문을 보고 먼저 스스로 설명해 본 뒤 답을 확인해보세요. 총{" "}
          {interviewQuestions.length}개의 질문이 준비되어 있어요.
        </p>
      </div>

      <InterviewCategoryFilter value={category} onChange={updateCategory} />

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <FiHelpCircle className="size-8 text-muted-foreground" aria-hidden />
            <div>
              <h2 className="font-semibold">
                {category
                  ? `${getInterviewCategoryLabel(category)} 질문이 아직 없어요.`
                  : "질문이 아직 없어요."}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                다른 분야를 선택해보세요.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {category
              ? `${getInterviewCategoryLabel(category)} ${questions.length}문항`
              : `전체 ${questions.length}문항`}
          </p>
          <ul className="space-y-4">
            {questions.map((question) => (
              <li key={question.id}>
                <InterviewQuestionCard question={question} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
