"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { Feed } from "@/types/feed";
import { formatDate } from "@/utils/feedUtils";
import { Badge } from "@/components/ui/badge";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { useAuthStore } from "@/stores/authStore";
import { dailyActivityQueryKey } from "@/utils/dailyActivityUtils";

interface FeedCardProps {
  feed: Feed;
  handleScrap: (feed: Feed) => void;
}

export default function FeedCard({ feed, handleScrap }: FeedCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
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
            category: feed.category,
            published_at: feed.published_at,
            interests: feed.interests ?? [],
          },
        }),
      });
      if (!response.ok) return;

      queryClient.invalidateQueries({
        queryKey: dailyActivityQueryKey(user.id, getSeoulDateKey()),
      });
    } catch (error) {
      console.error("피드 클릭 기록 저장 실패:", error);
    }
  }, [
    feed.id,
    feed.category,
    feed.interests,
    feed.published_at,
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
        onClick={handleFeedClick}
        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="h-full overflow-hidden border-0 bg-transparent py-0 shadow-none">
          {/* 이미지 섹션 */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary"></div>
              </div>
            )}
            <Image
              src={feed.image_url || ""}
              alt={feed.title}
              fill
              className={`object-cover transition-[opacity,scale] duration-500 ease-in-out group-hover:scale-105 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
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
            {feed.author && (
              <span className="text-xs text-muted-foreground">
                by {feed.author}
              </span>
            )}
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
