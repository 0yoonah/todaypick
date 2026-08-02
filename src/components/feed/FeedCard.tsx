"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { FiExternalLink } from "react-icons/fi";
import { Feed } from "@/types/feed";
import { formatDate } from "@/utils/feedUtils";
import { Badge } from "@/components/ui/badge";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { useAuthStore } from "@/stores/authStore";
import { markDailyActivityCompleted } from "@/utils/dailyActivityUtils";

interface FeedCardProps {
  feed: Feed;
  handleScrap: (feed: Feed) => void;
}

export default function FeedCard({ feed, handleScrap }: FeedCardProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleFeedClick = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/daily-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity: "feed_clicked",
          feed: {
            id: feed.id,
            title: feed.title,
            source: feed.source,
            url: feed.url,
            interests: feed.interests ?? [],
          },
        }),
      });
      if (!response.ok) return;

      markDailyActivityCompleted(
        queryClient,
        user.id,
        getSeoulDateKey(),
        "feed_clicked"
      );
    } catch (error) {
      console.error("피드 클릭 기록 저장 실패:", error);
    }
  }, [
    feed.id,
    feed.interests,
    feed.source,
    feed.title,
    feed.url,
    queryClient,
    user,
  ]);

  const handleScrapClick = () => {
    handleScrap(feed);
  };

  return (
    <div className="relative h-full">
      <Link
        href={feed.url || ""}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleFeedClick}
        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="h-full overflow-hidden border-0 bg-transparent py-0 shadow-none">
          <div className="flex aspect-[16/7] w-full items-end overflow-hidden rounded-lg bg-muted px-5 py-4">
            <span className="line-clamp-2 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
              {feed.source}에서 제공한 콘텐츠
            </span>
          </div>

          <CardHeader className="px-0 pt-4 pb-2">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-sm font-medium">
                {feed.source}
              </Badge>
              <span aria-hidden>·</span>
              <span>{formatDate(feed.published_at)}</span>
            </div>
            <CardTitle className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.02em] text-card-foreground transition-colors group-hover:text-primary">
              {feed.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0 pt-0">
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {feed.description}
            </p>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              {feed.author ? <span>작성자 {feed.author}</span> : <span />}
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                원문 보기
                <FiExternalLink aria-hidden />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <button
        type="button"
        className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-sm transition-colors hover:text-primary sm:size-9"
        onClick={handleScrapClick}
        aria-label={feed.is_scraped ? "스크랩 해제" : "스크랩 추가"}
      >
        {feed.is_scraped ? (
          <GoBookmarkFill className="text-lg text-primary" />
        ) : (
          <GoBookmark className="text-lg" />
        )}
      </button>
    </div>
  );
}
