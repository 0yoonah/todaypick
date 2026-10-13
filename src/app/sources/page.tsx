import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/config/constants";
import { feedCategories, getFeedSources } from "@/data/feeds";
import type { RSSFeedCategory } from "@/types/feed";

export const metadata: Metadata = {
  title: "출처 안내 | TodayPick",
  description:
    "TodayPick이 외부 글을 수집하고 보여 주는 방식, 수집 중인 출처 목록과 삭제 요청 방법을 안내합니다.",
};

/**
 * 출처 목록은 정적 데이터라 서버에서 렌더링한다.
 * 비활성화한 소스는 getFeedSources가 제외한다.
 */
export default function SourcesPage() {
  const sourceGroups = feedCategories.map((category) => ({
    ...category,
    sources: getFeedSources(category.id as RSSFeedCategory),
  }));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">출처 안내</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            외부 글을 다루는 방식
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            TodayPick은 공개 RSS로 IT 기사와 테크 블로그의 새 글을 모아
            원문으로 안내하는 비영리 개인 프로젝트입니다. 글의 권리는 각 원
            출처에 있습니다.
          </p>
        </div>

        <div className="max-w-2xl divide-y">
          <section className="pb-8">
            <h2 className="text-xl font-bold text-foreground">보여 주는 범위</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>제목, 출처, 작성자, 발행일과 원문 링크를 표시합니다.</li>
              <li>
                RSS가 제공하는 설명 중 앞부분 일부만 표시합니다. 본문 전체는
                저장하거나 보여 주지 않습니다.
              </li>
              <li>
                썸네일은 원 출처 서버의 이미지를 그대로 불러오며 TodayPick
                서버에 복제하거나 저장하지 않습니다.
              </li>
              <li>카드를 누르면 원문 페이지로 이동합니다.</li>
            </ul>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-bold text-foreground">
              삭제·수정 요청
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              권리자께서 수집 중단이나 표시 내용 수정을 원하시면{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                {CONTACT_EMAIL}
              </a>
              로 알려 주세요. 출처 이름과 요청 내용을 확인하는 대로 해당 출처를
              수집 대상에서 제외하거나 수정합니다.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-xl font-bold text-foreground">수집 중인 출처</h2>
            <div className="mt-4 space-y-6">
              {sourceGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      {group.sources.length}곳
                    </span>
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground">
                    {group.sources.map((source) => (
                      <li key={source.id}>{source.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
