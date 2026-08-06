"use client";

import { useId, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InterviewQuestion } from "@/types/interview";
import {
  getInterviewCategoryColor,
  getInterviewCategoryLabel,
} from "@/utils/interviewUtils";

interface InterviewQuestionCardProps {
  question: InterviewQuestion;
}

export default function InterviewQuestionCard({
  question,
}: InterviewQuestionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = useId();

  return (
    <Card className="w-full shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
              getInterviewCategoryColor(question.category)
            )}
          >
            {getInterviewCategoryLabel(question.category)}
          </span>
        </div>

        <h2 className="text-base font-semibold leading-relaxed text-card-foreground sm:text-lg">
          {question.question}
        </h2>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={answerId}
          className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isOpen ? "답 접기" : "답 보기"}
          <FiChevronDown
            className={cn(
              "size-4 transition-transform motion-reduce:transition-none",
              isOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {isOpen && (
          <div id={answerId} className="mt-4 space-y-4 border-t pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {question.answer}
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                꼭 언급할 키워드
              </p>
              <ul className="flex flex-wrap gap-2">
                {question.keywords.map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
