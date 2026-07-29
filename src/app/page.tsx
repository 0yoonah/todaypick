import DailyLearningChecklist from "@/components/DailyLearningChecklist";
import TodayFeed from "@/components/feed/TodayFeed";
import TodayQuiz from "@/components/TodayQuiz";
import TodayQuote from "@/components/quote/TodayQuote";

export default function Home() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <DailyLearningChecklist />

        {/* 오늘의 피드 */}
        <section id="today-feed" className="scroll-mt-24">
          <TodayFeed />
        </section>

        {/* 오늘의 IT 퀴즈 */}
        <section id="today-quiz" className="scroll-mt-24">
          <TodayQuiz />
        </section>

        {/* 오늘의 명언 */}
        <section id="today-quote" className="scroll-mt-24">
          <TodayQuote />
        </section>
      </div>
    </div>
  );
}
