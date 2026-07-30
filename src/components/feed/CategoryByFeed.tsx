"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { FeedCategory } from "@/types/feed";
import { FEED_CATEGORY } from "@/config/constants";
import { getValidCategory } from "@/utils/feedUtils";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import FeedCategoryTab from "@/components/feed/FeedCategoryTab";
import FeedCard from "@/components/feed/FeedCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import InfiniteScrollTrigger from "@/components/feed/InfiniteScrollTrigger";
import FeedListState from "@/components/feed/FeedListState";

export default function CategoryByFeed() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const validCategory = getValidCategory(category);
  const pathname = usePathname();

  const {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    feeds,
    activeTab,
    handleScrap,
    handleChangeTab,
    fetchNextPage,
    refetch,
    error,
  } = useInfiniteFeed({
    category: validCategory,
    limit: 12,
  });

  const handleTabChange = useCallback(
    (tab: FeedCategory) => {
      handleChangeTab(tab);
      window.history.pushState(null, "", `${pathname}?category=${tab}`);
    },
    [handleChangeTab, pathname]
  );

  useEffect(() => {
    const handleHistoryChange = () => {
      const nextCategory = getValidCategory(
        new URLSearchParams(window.location.search).get("category")
      );
      handleChangeTab(nextCategory);
    };

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, [handleChangeTab]);

  return (
    <div>
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-primary">읽을거리</p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          {activeTab === FEED_CATEGORY.IT_NEWS ? "IT 기사" : "테크 블로그"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {activeTab === FEED_CATEGORY.IT_NEWS
            ? "최신 IT 뉴스와 업계 동향을 확인해보세요."
            : "개발자들의 기술 블로그와 튜토리얼을 확인해보세요."}
        </p>
      </div>

      <FeedCategoryTab
        activeTab={activeTab}
        handleChangeTab={handleTabChange}
      />

      <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <SkeletonFeedCard key={index} />
          ))
        ) : error ? (
          <FeedListState type="error" onRetry={() => void refetch()} />
        ) : feeds.length === 0 ? (
          <FeedListState type="empty" />
        ) : (
          feeds.map((feed) => (
            <FeedCard key={feed.id} feed={feed} handleScrap={handleScrap} />
          ))
        )}
      </div>

      {!error && feeds.length > 0 && (
        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </div>
  );
}
