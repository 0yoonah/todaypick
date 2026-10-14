import DailyLearningChecklist from "@/components/DailyLearningChecklist";
import TodayFeed from "@/components/feed/TodayFeed";
import TodayQuiz from "@/components/TodayQuiz";
import TodayQuote from "@/components/quote/TodayQuote";
import { FEED_CATEGORY } from "@/config/constants";
import { loadInitialFeedPage } from "@/services/feedPageService";
import { HOME_PREVIEW_COUNT } from "@/utils/homeFeedUtils";

export default async function Home() {
  // "오늘 읽어볼 콘텐츠" 첫 카드를 서버에서 미리 조회해 HTML과 함께 보낸다.
  const initialFeedPage = await loadInitialFeedPage({
    category: FEED_CATEGORY.IT_NEWS,
    limit: HOME_PREVIEW_COUNT,
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-12">
          <DailyLearningChecklist />
        </div>

        <section id="today-feed" className="scroll-mt-24">
          <TodayFeed initialPage={initialFeedPage} />
        </section>

        <div className="mt-16 grid gap-14 border-t pt-14 lg:grid-cols-2 lg:gap-10">
          <section id="today-quiz" className="scroll-mt-24">
            <TodayQuiz />
          </section>
          <section id="today-quote" className="scroll-mt-24">
            <TodayQuote />
          </section>
        </div>
      </div>
    </main>
  );
}
