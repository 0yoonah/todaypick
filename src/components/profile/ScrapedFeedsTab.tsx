"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle } from "react-icons/fi";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { FEED_CATEGORY, ROUTE_PATH } from "@/config/constants";
import FeedCard from "@/components/feed/FeedCard";
import WrittenPostCard from "@/components/feed/WrittenPostCard";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import InfiniteScrollTrigger from "@/components/feed/InfiniteScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  resolveSavedContentState,
  type SavedContentSectionKey,
} from "@/utils/savedContentUtils";
import type { RSSFeedCategory } from "@/types/feed";
import type { WritingDraft } from "@/types/writing";

type SavedContentFilter = "all" | RSSFeedCategory | "writing";

const FILTERS: { id: SavedContentFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: FEED_CATEGORY.IT_NEWS, label: "IT 기사" },
  { id: FEED_CATEGORY.TECH_BLOG, label: "테크 블로그" },
  { id: "writing", label: "게시글" },
];

async function fetchWritingBookmarks(): Promise<WritingDraft[]> {
  const response = await fetch("/api/writing-bookmarks");
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "북마크한 게시글을 불러오지 못했습니다.");
  }
  return result.drafts ?? [];
}

export default function ScrapedFeedsTab() {
  const [filter, setFilter] = useState<SavedContentFilter>("all");
  const queryClient = useQueryClient();
  const showFeeds = filter !== "writing";
  const showWriting = filter === "all" || filter === "writing";
  const sourceCategory =
    filter === FEED_CATEGORY.IT_NEWS || filter === FEED_CATEGORY.TECH_BLOG
      ? filter
      : undefined;
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
    limit: 6,
    sourceCategory,
    enabled: showFeeds,
  });
  const bookmarksQuery = useQuery({
    queryKey: ["writing-bookmarks"],
    queryFn: fetchWritingBookmarks,
    enabled: showWriting,
    staleTime: 5 * 60 * 1000,
  });
  const bookmarkMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const response = await fetch(`/api/writing-bookmarks?draftId=${draftId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "북마크를 해제하지 못했습니다.");
      }
      return draftId;
    },
    onSuccess: (draftId) => {
      queryClient.setQueryData<WritingDraft[]>(["writing-bookmarks"], (drafts) =>
        drafts?.filter((draft) => draft.id !== draftId)
      );
      queryClient.setQueriesData<WritingDraft[]>({
        queryKey: ["writing-drafts", "public"],
      }, (drafts) =>
        drafts?.map((draft) =>
          draft.id === draftId ? { ...draft, is_bookmarked: false } : draft
        )
      );
      queryClient.setQueryData<WritingDraft>(["writing-draft", draftId], (draft) =>
        draft ? { ...draft, is_bookmarked: false } : draft
      );
    },
  });

  const bookmarkedPosts = showWriting ? bookmarksQuery.data ?? [] : [];
  const visibleFeeds = showFeeds ? feeds : [];
  const retryBySection: Record<SavedContentSectionKey, () => void> = {
    feeds: () => void refetch(),
    writing: () => void bookmarksQuery.refetch(),
  };
  const contentState = resolveSavedContentState([
    {
      key: "feeds",
      label: "RSS 스크랩",
      active: showFeeds,
      isLoading,
      isError: Boolean(error),
      count: visibleFeeds.length,
    },
    {
      key: "writing",
      label: "게시글 북마크",
      active: showWriting,
      isLoading: bookmarksQuery.isLoading,
      isError: bookmarksQuery.isError,
      count: bookmarkedPosts.length,
    },
  ]);
  const partialFailures = contentState.isAllFailed ? [] : contentState.failed;

  return (
    <div>
      <div
        className="mb-7 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
        role="group"
        aria-label="저장 콘텐츠 유형 필터"
      >
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              filter === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {partialFailures.length > 0 && (
        <div className="mb-6 space-y-2">
          {partialFailures.map((section) => (
            <div
              key={section.key}
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <FiAlertTriangle
                className="size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                {section.label}을(를) 불러오지 못했습니다. 나머지 콘텐츠는 그대로
                표시됩니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={retryBySection[section.key]}
              >
                {section.label} 다시 시도
              </Button>
            </div>
          ))}
        </div>
      )}

      {contentState.isInitialLoading ? (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonFeedCard key={index} showActions={false} />
          ))}
        </div>
      ) : contentState.isAllFailed ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div>
              <h3 className="font-semibold">저장한 콘텐츠를 불러오지 못했습니다.</h3>
              <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해주세요.</p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                contentState.failed.forEach((section) =>
                  retryBySection[section.key]()
                )
              }
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : contentState.isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div>
              <h3 className="font-semibold">저장한 {FILTERS.find((item) => item.id === filter)?.label} 콘텐츠가 없습니다.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                관심 있는 피드와 게시글을 북마크해보세요.
              </p>
            </div>
            <Button asChild>
              <Link href={ROUTE_PATH.FEEDS}>피드 둘러보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleFeeds.map((feed) => (
              <FeedCard key={`feed-${feed.id}`} feed={feed} handleScrap={handleScrap} />
            ))}
            {bookmarkedPosts.map((draft) => (
              <WrittenPostCard
                key={`writing-${draft.id}`}
                draft={draft}
                onBookmark={(item) => bookmarkMutation.mutate(item.id)}
                bookmarkPending={bookmarkMutation.isPending}
              />
            ))}
            {contentState.pending.map((section) => (
              <SkeletonFeedCard key={section.key} showActions={false} />
            ))}
          </div>
          {contentState.totalCount === 0 && contentState.pending.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              불러온 저장 콘텐츠가 없습니다.
            </p>
          )}
          {showFeeds && !error && (
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
