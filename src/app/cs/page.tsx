import type { Metadata } from "next";
import { FiHelpCircle } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import CsCategoryFilter from "@/components/cs/CsCategoryFilter";
import CsQuestionList from "@/components/cs/CsQuestionList";
import { csQuestions } from "@/data/csQuestions";
import { glossaryTerms } from "@/data/glossaryTerms";
import { isCsCategory } from "@/types/cs";
import { filterCsQuestions, getCsCategoryLabel } from "@/utils/csUtils";
import { buildKeywordLinks } from "@/utils/glossaryUtils";

export const metadata: Metadata = {
  title: "CS 지식 | TodayPick",
  description:
    "네트워크, 운영체제, 데이터베이스, 프론트엔드, 백엔드 등 분야별 CS 지식을 스스로 설명해 보고 답을 확인하세요.",
};

interface CsPageProps {
  searchParams: Promise<{ category?: string }>;
}

/**
 * 분야 필터를 서버에서 적용해 초기 HTML에 질문이 담기게 한다.
 * 답변 작성과 채점 저장만 클라이언트 컴포넌트가 담당한다.
 */
export default async function CsPage({ searchParams }: CsPageProps) {
  const params = await searchParams;
  const category = isCsCategory(params.category) ? params.category : undefined;
  const questions = filterCsQuestions(csQuestions, category);
  // 용어사전 데이터가 아니라 연결된 키워드만 클라이언트로 넘긴다.
  const keywordLinks = buildKeywordLinks(questions, glossaryTerms);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">CS 지식</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            CS 지식 다지기
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            질문을 보고 먼저 스스로 설명해 본 뒤 답을 확인해보세요. 면접에서도
            자주 다루는 주제로 총 {csQuestions.length}개를 준비했어요.
          </p>
        </div>

        <CsCategoryFilter value={category} />

        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <FiHelpCircle className="size-8 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="font-semibold">
                  {category
                    ? `${getCsCategoryLabel(category)} 질문이 아직 없어요.`
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
                ? `${getCsCategoryLabel(category)} ${questions.length}문항`
                : `전체 ${questions.length}문항`}
            </p>
            <CsQuestionList questions={questions} keywordLinks={keywordLinks} />
          </>
        )}
      </div>
    </main>
  );
}
