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
import { markDailyActivityCompleted } from "@/utils/dailyActivityUtils";

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

  const handleScrapClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleScrap(feed);
  };

  return (
    <Link href={feed.url || ""} target="_blank" onClick={handleFeedClick}>
      <Card className="h-full shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden relative group">
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 z-20"
          onClick={handleScrapClick}
          aria-label={feed.is_scraped ? "스크랩 해제" : "스크랩 추가"}
        >
          {feed.is_scraped ? (
            <GoBookmarkFill className="text-xl text-primary cursor-pointer" />
          ) : (
            <GoBookmark className="text-xl text-muted-foreground hover:text-primary cursor-pointer" />
          )}
        </button>

        {/* 이미지 섹션 */}
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          <Image
            src={feed.image_url || ""}
            alt={feed.title}
            fill
            className={`object-cover transition-all duration-200 group-hover:scale-105 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2 mb-2">
            {feed.title}
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {feed.source}
            </Badge>
            <span>•</span>
            <span>{formatDate(feed.published_at)}</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
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
  );
}
