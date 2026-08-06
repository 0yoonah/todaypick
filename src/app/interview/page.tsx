import { Suspense } from "react";
import type { Metadata } from "next";
import InterviewQuestionList from "@/components/interview/InterviewQuestionList";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "CS 면접 질문 | TodayPick",
  description:
    "네트워크, 운영체제, 데이터베이스 등 분야별 CS 면접 질문을 스스로 설명해 보고 답을 확인하세요.",
};

export default function InterviewPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <Suspense
          fallback={
            <div className="space-y-4" aria-label="면접 질문을 불러오는 중">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          }
        >
          <InterviewQuestionList />
        </Suspense>
      </div>
    </main>
  );
}
