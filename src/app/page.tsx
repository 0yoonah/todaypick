import DailyLearningChecklist from "@/components/DailyLearningChecklist";
import TodayFeed from "@/components/feed/TodayFeed";
import TodayQuiz from "@/components/TodayQuiz";
import TodayQuote from "@/components/quote/TodayQuote";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-12">
          <DailyLearningChecklist />
        </div>

        <section id="today-feed" className="scroll-mt-24">
          <TodayFeed />
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
