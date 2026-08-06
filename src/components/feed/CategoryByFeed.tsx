"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { FeedCategory } from "@/types/feed";
import { FEED_CATEGORY } from "@/config/constants";
import { getValidCategory, isWritingCategory } from "@/utils/feedUtils";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import FeedCategoryTab from "@/components/feed/FeedCategoryTab";
import FeedCard from "@/components/feed/FeedCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import InfiniteScrollTrigger from "@/components/feed/InfiniteScrollTrigger";
import FeedListState from "@/components/feed/FeedListState";
import ReadingGoalProgress from "@/components/ReadingGoalProgress";
import WrittenPostsTab from "@/components/feed/WrittenPostsTab";
import InterestFilter from "@/components/feed/InterestFilter";
import { INTERESTS, isInterestId, type InterestId } from "@/config/interests";

export default function CategoryByFeed() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const interestParam = searchParams.get("interest");
  const interest = isInterestId(interestParam) ? interestParam : undefined;
  const interestLabel = INTERESTS.find((item) => item.id === interest)?.label;
  const validCategory = getValidCategory(category);
  const router = useRouter();
  const showWritingTab = isWritingCategory(category);

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
    interest,
    enabled: !showWritingTab,
  });

  const updateQuery = useCallback(
    (nextCategory: FeedCategory | "writing", nextInterest?: InterestId) => {
      const params = new URLSearchParams();
      params.set("category", nextCategory);
      if (nextInterest) params.set("interest", nextInterest);
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  const handleTabChange = useCallback(
    (tab: FeedCategory) => {
      handleChangeTab(tab);
      updateQuery(tab, interest);
    },
    [handleChangeTab, interest, updateQuery]
  );

  useEffect(() => {
    if (!showWritingTab) handleChangeTab(validCategory);
  }, [handleChangeTab, showWritingTab, validCategory]);

  return (
    <div>
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-primary">읽을거리</p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          {showWritingTab
            ? "게시글"
            : activeTab === FEED_CATEGORY.IT_NEWS
              ? "IT 기사"
              : "테크 블로그"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {showWritingTab
            ? "TodayPick 사용자들이 공유한 글을 확인해보세요."
            : activeTab === FEED_CATEGORY.IT_NEWS
            ? "최신 IT 뉴스와 업계 동향을 확인해보세요."
            : "개발자들의 기술 블로그와 튜토리얼을 확인해보세요."}
        </p>
      </div>

      <div className="mb-8">
        <ReadingGoalProgress />
      </div>

      <FeedCategoryTab
        activeTab={showWritingTab ? "writing" : activeTab}
        handleChangeTab={handleTabChange}
        handleChangeWritingTab={() => updateQuery("writing", interest)}
      />

      <InterestFilter
        value={interest}
        onChange={(nextInterest) =>
          updateQuery(showWritingTab ? "writing" : activeTab, nextInterest)
        }
      />

      {showWritingTab ? (
        <WrittenPostsTab interest={interest} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <SkeletonFeedCard key={index} />
              ))
            ) : error ? (
              <FeedListState type="error" onRetry={() => void refetch()} />
            ) : feeds.length === 0 ? (
              <FeedListState type="empty" interestLabel={interestLabel} />
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
        </>
      )}
    </div>
  );
}
