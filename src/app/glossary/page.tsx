import type { Metadata } from "next";
import { FiSearch } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import GlossarySearchInput from "@/components/glossary/GlossarySearchInput";
import GlossaryTermList from "@/components/glossary/GlossaryTermList";
import { glossaryTerms } from "@/data/glossaryTerms";
import { searchGlossaryTerms } from "@/utils/glossaryUtils";

export const metadata: Metadata = {
  title: "IT 용어사전 | TodayPick",
  description:
    "네트워크, 운영체제, 데이터베이스, 프론트엔드, 백엔드 등 개발자가 자주 만나는 IT 용어를 가나다순으로 찾아보세요.",
};

interface GlossaryPageProps {
  searchParams: Promise<{ q?: string }>;
}

/**
 * 정적 데이터를 서버에서 렌더링해 초기 HTML에 용어가 담기게 한다.
 * 검색 입력만 클라이언트 컴포넌트로 두고 URL을 갱신한다.
 */
export default async function GlossaryPage({
  searchParams,
}: GlossaryPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  const terms = searchGlossaryTerms(glossaryTerms, { query });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">용어사전</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            IT 용어 찾아보기
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            모르는 용어를 만나면 바로 확인해보세요. 영문 표기나 약어로도 찾을 수
            있어요. 총 {glossaryTerms.length}개를 가나다순으로 담았어요.
          </p>
        </div>

        <GlossarySearchInput query={query} />

        {terms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <FiSearch className="size-8 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="font-semibold">
                  {`'${query}'에 해당하는 용어가 없어요.`}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  표제어와 영문 표기로 검색할 수 있어요. 다른 검색어를
                  입력해보세요.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {query ? `'${query}' 검색 결과 ${terms.length}개` : `전체 ${terms.length}개`}
            </p>
            <GlossaryTermList terms={terms} />
          </>
        )}
      </div>
    </main>
  );
}
