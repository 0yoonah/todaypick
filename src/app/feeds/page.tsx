import { Suspense } from "react";
import CategoryByFeed, {
  type InitialFeedPage,
} from "@/components/feed/CategoryByFeed";
import { FEED_PAGE_SIZE } from "@/config/constants";
import { isInterestId } from "@/config/interests";
import { loadInitialFeedPage } from "@/services/feedPageService";
import type { RSSFeedCategory } from "@/types/feed";
import { getValidCategory, isWritingCategory } from "@/utils/feedUtils";

type FeedsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * 첫 페이지 카드를 서버에서 미리 조회해 HTML과 함께 보낸다.
 * 브라우저가 JS를 실행한 뒤 다시 요청하던 단계가 없어져 첫 카드가 빨리 보인다.
 */
async function loadInitialPage(
  params: Record<string, string | string[] | undefined>
): Promise<InitialFeedPage | null> {
  const categoryParam = first(params.category) ?? null;
  if (isWritingCategory(categoryParam)) return null;

  const category = getValidCategory(categoryParam) as RSSFeedCategory;
  const interestParam = first(params.interest);
  const interest = isInterestId(interestParam) ? interestParam : undefined;

  const page = await loadInitialFeedPage({
    category,
    limit: FEED_PAGE_SIZE,
    interest,
  });
  return page ? { category, interest, page } : null;
}

export default async function FeedsPage({ searchParams }: FeedsPageProps) {
  const initialFeedPage = await loadInitialPage(await searchParams);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <Suspense>
          <CategoryByFeed initialFeedPage={initialFeedPage} />
        </Suspense>
      </div>
    </main>
  );
}
