import { FEED_CATEGORY, ROUTE_PATH } from "@/config/constants";
import { FeedCategory } from "@/types/feed";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeedCategoryTabProps {
  activeTab: FeedCategory | "writing";
  handleChangeTab: (tab: FeedCategory) => void;
  handleChangeWritingTab: () => void;
}

export default function FeedCategoryTab({
  activeTab,
  handleChangeTab,
  handleChangeWritingTab,
}: FeedCategoryTabProps) {
  return (
    <div className="mb-7 flex items-center justify-between gap-4 border-b border-border">
      <div className="flex gap-6" role="tablist" aria-label="피드 종류">
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
        <button
          onClick={handleChangeWritingTab}
          role="tab"
          aria-selected={activeTab === "writing"}
          className={cn(
            "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors",
            activeTab === "writing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          게시글
        </button>
      </div>
      <Link
        href={ROUTE_PATH.WRITE}
        className="mb-3 text-sm font-semibold text-primary hover:underline"
      >
        글쓰기
      </Link>
    </div>
  );
}
