"use client";

import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { FEED_CATEGORY, ROUTE_PATH } from "@/config/constants";
import Link from "next/link";
import FeedCard from "@/components/feed/FeedCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import InfiniteScrollTrigger from "@/components/feed/InfiniteScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ScrapedFeedsTab() {
  const {
    feeds,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleScrap,
    error,
    refetch,
  } = useInfiniteFeed({
    category: FEED_CATEGORY.SCRAPED,
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonFeedCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h3 className="font-semibold">스크랩한 피드를 불러오지 못했습니다.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              잠시 후 다시 시도해주세요.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (feeds.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h3 className="font-semibold">스크랩한 피드가 없습니다.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              관심 있는 IT 기사와 테크 블로그를 저장해보세요.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTE_PATH.FEEDS}>피드 둘러보기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {feeds.map((feed) => (
          <FeedCard key={feed.id} feed={feed} handleScrap={handleScrap} />
        ))}
      </div>
      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </>
  );
}
