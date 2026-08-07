import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTE_PATH } from "@/config/constants";
import { csQuestions } from "@/data/csQuestions";
import { glossaryTerms } from "@/data/glossaryTerms";
import { getCsCategoryColor, getCsCategoryLabel } from "@/utils/csUtils";
import {
  findRelatedCsQuestions,
  getRelatedTerms,
  toTermMap,
} from "@/utils/glossaryUtils";

interface GlossaryTermPageProps {
  params: Promise<{ id: string }>;
}

/** 용어 수가 고정돼 있어 모든 상세 페이지를 미리 생성한다. */
export function generateStaticParams() {
  return glossaryTerms.map((term) => ({ id: term.id }));
}

export async function generateMetadata({
  params,
}: GlossaryTermPageProps): Promise<Metadata> {
  const { id } = await params;
  const term = glossaryTerms.find((item) => item.id === id);

  if (!term) return { title: "용어를 찾을 수 없습니다 | TodayPick" };

  return {
    title: `${term.term} | IT 용어사전 | TodayPick`,
    description: term.definition,
  };
}

export default async function GlossaryTermPage({
  params,
}: GlossaryTermPageProps) {
  const { id } = await params;
  const term = glossaryTerms.find((item) => item.id === id);

  if (!term) notFound();

  const related = getRelatedTerms(term, toTermMap(glossaryTerms));
  const relatedQuestions = findRelatedCsQuestions(term, csQuestions);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href={ROUTE_PATH.GLOSSARY}
          className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <FiArrowLeft className="size-4" aria-hidden />
          용어사전
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                getCsCategoryColor(term.category)
              )}
            >
              {getCsCategoryLabel(term.category)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            {term.term}
          </h1>
          {term.aliases.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {term.aliases.join(" · ")}
            </p>
          )}
        </div>

        <p className="text-base font-medium leading-relaxed text-foreground">
          {term.definition}
        </p>

        <p className="mt-4 whitespace-pre-line text-base leading-loose text-muted-foreground">
          {term.detail}
        </p>

        {relatedQuestions.length > 0 && (
          <section className="mt-10" aria-labelledby="related-questions-title">
            <h2 id="related-questions-title" className="mb-1 font-bold">
              이 개념을 설명해보기
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              CS 지식에서 관련 질문에 직접 답해보면 이해가 분명해져요.
            </p>
            <ul className="space-y-3">
              {relatedQuestions.map((question) => (
                <li key={question.id}>
                  <Link
                    href={`${ROUTE_PATH.CS}?category=${question.category}#${question.id}`}
                    className="block cursor-pointer rounded-xl border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">
                        {question.question}
                      </span>
                      <FiExternalLink
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-terms-title">
            <h2 id="related-terms-title" className="mb-4 font-bold">
              관련 용어
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${ROUTE_PATH.GLOSSARY}/${item.id}`}
                    className="block h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Card className="h-full shadow-none transition-colors hover:bg-muted/40">
                      <CardContent className="p-4">
                        <span className="block text-sm font-semibold">
                          {item.term}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.definition}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
