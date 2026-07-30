"use client";

import Link from "next/link";
import { ROUTE_PATH, FEED_CATEGORY } from "@/config/constants";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import FeedCategoryTab from "@/components/feed/FeedCategoryTab";
import FeedCard from "@/components/feed/FeedCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";

export default function TodayFeed() {
  const { isLoading, feeds, activeTab, handleScrap, handleChangeTab } =
    useInfiniteFeed({
      category: FEED_CATEGORY.IT_NEWS,
      limit: 3,
    });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.025em] text-foreground">
              오늘 읽어볼 콘텐츠
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              놓치기 아쉬운 IT 소식을 가볍게 골라봤어요.
            </p>
          </div>
          <Link
            href={ROUTE_PATH.FEEDS + "?category=" + activeTab}
            className="text-sm font-semibold text-primary hover:underline"
          >
            전체보기
          </Link>
        </div>
      </div>

      <FeedCategoryTab
        activeTab={activeTab}
        handleChangeTab={handleChangeTab}
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || feeds.length === 0
          ? Array.from({ length: 3 }).map((_, index) => (
              <SkeletonFeedCard key={index} />
            ))
          : feeds
              .slice(0, 3)
              .map((feed) => (
                <FeedCard key={feed.id} feed={feed} handleScrap={handleScrap} />
              ))}
      </div>
    </div>
  );
}
