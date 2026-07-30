import { FEED_CATEGORY } from "@/config/constants";
import { FeedCategory } from "@/types/feed";
import { cn } from "@/lib/utils";

interface FeedCategoryTabProps {
  activeTab: FeedCategory;
  handleChangeTab: (tab: FeedCategory) => void;
}

export default function FeedCategoryTab({
  activeTab,
  handleChangeTab,
}: FeedCategoryTabProps) {
  return (
    <div
      className="mb-7 flex gap-6 border-b border-border"
      role="tablist"
      aria-label="피드 종류"
    >
      <button
        onClick={() => handleChangeTab(FEED_CATEGORY.IT_NEWS)}
        role="tab"
        aria-selected={activeTab === FEED_CATEGORY.IT_NEWS}
        className={cn(
          "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
          activeTab === FEED_CATEGORY.IT_NEWS
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        IT 기사
      </button>
      <button
        onClick={() => handleChangeTab(FEED_CATEGORY.TECH_BLOG)}
        role="tab"
        aria-selected={activeTab === FEED_CATEGORY.TECH_BLOG}
        className={cn(
          "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
          activeTab === FEED_CATEGORY.TECH_BLOG
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        테크 블로그
      </button>
    </div>
  );
}
