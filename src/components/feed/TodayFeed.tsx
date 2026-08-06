"use client";

import Link from "next/link";
import { useState } from "react";
import { FEED_CATEGORY } from "@/config/constants";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import {
  getFeedOverviewHref,
  getHomePreviewItems,
  HOME_PREVIEW_COUNT,
} from "@/utils/homeFeedUtils";
import { shouldPrioritizeImage } from "@/utils/imagePriorityUtils";
import FeedCategoryTab from "@/components/feed/FeedCategoryTab";
import FeedCard from "@/components/feed/FeedCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import FeedListState from "@/components/feed/FeedListState";
import WrittenPostsTab from "@/components/feed/WrittenPostsTab";

export default function TodayFeed() {
  const [viewTab, setViewTab] = useState<"feed" | "writing">("feed");
  const {
    isLoading,
    feeds,
    activeTab,
    handleScrap,
    handleChangeTab,
    error,
    refetch,
  } = useInfiniteFeed({
    category: FEED_CATEGORY.IT_NEWS,
    limit: 3,
  });

  const showWritingTab = viewTab === "writing";

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              오늘 읽어볼 콘텐츠
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              놓치기 아쉬운 IT 소식을 가볍게 골라봤어요.
            </p>
          </div>
          <Link
            href={getFeedOverviewHref(showWritingTab ? "writing" : activeTab)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            전체보기
          </Link>
        </div>
      </div>

      <FeedCategoryTab
        activeTab={showWritingTab ? "writing" : activeTab}
        handleChangeTab={(tab) => {
          setViewTab("feed");
          handleChangeTab(tab);
        }}
        handleChangeWritingTab={() => setViewTab("writing")}
      />

      {showWritingTab ? (
        <WrittenPostsTab limit={HOME_PREVIEW_COUNT} />
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: HOME_PREVIEW_COUNT }).map((_, index) => (
              <SkeletonFeedCard key={index} />
            ))
          ) : error ? (
            <FeedListState type="error" onRetry={() => void refetch()} />
          ) : feeds.length === 0 ? (
            <FeedListState type="empty" />
          ) : (
            getHomePreviewItems(feeds).map((feed, index) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                handleScrap={handleScrap}
                priority={shouldPrioritizeImage(index)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
