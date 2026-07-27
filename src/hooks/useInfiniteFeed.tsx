"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Feed, FeedCategory } from "@/types/feed";
import { FEED_CATEGORY, ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { feedService } from "@/services/feedService";

interface UseInfiniteFeedProps {
  category: FeedCategory;
  limit: number;
}

interface FeedPage {
  feeds: Feed[];
  currentPage: number;
  totalCount: number;
  totalPages: number;
}

interface InfiniteFeedData {
  pages: FeedPage[];
  pageParams: number[];
}

type FeedQuerySnapshot = [readonly unknown[], InfiniteFeedData | undefined];

const fetchFeeds = async ({
  category,
  pageParam,
  limit,
}: {
  category: FeedCategory;
  pageParam: number;
  limit: number;
}) => {
  const params = new URLSearchParams({
    category: category,
    page: pageParam.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/feeds?${params}`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "피드를 불러오는데 실패했습니다.");
  }

  return response.json() as Promise<FeedPage>;
};

export const useInfiniteFeed = ({ category, limit }: UseInfiniteFeedProps) => {
  const [activeTab, setActiveTab] = useState<FeedCategory>(category);
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feeds", activeTab, limit, user?.id],
    queryFn: ({ pageParam }) =>
      fetchFeeds({ category: activeTab, pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
  });

  const allFeeds = data?.pages.flatMap((page) => page.feeds) || [];
  const uniqueFeeds = allFeeds.filter(
    (feed, index, self) => index === self.findIndex((f) => f.id === feed.id)
  );

  const scrapMutation = useMutation({
    mutationFn: async (feed: Feed) => {
      if (feed.is_scraped) {
        await feedService.unscrapFeed(feed.id);
      } else {
        await feedService.scrapFeed(feed);
      }
    },
    onMutate: async (feed: Feed) => {
      await queryClient.cancelQueries({
        queryKey: ["feeds"],
      });

      const snapshots = queryClient.getQueriesData<InfiniteFeedData>({
        queryKey: ["feeds"],
      }) as FeedQuerySnapshot[];

      snapshots.forEach(([queryKey]) => {
        const cachedCategory = queryKey[1] as FeedCategory | undefined;
        const cachedLimit = Number(queryKey[2]) || limit;

        queryClient.setQueryData<InfiniteFeedData>(queryKey, (old) => {
          if (!old) return old;

          const shouldRemoveFromScraped =
            feed.is_scraped &&
            cachedCategory === FEED_CATEGORY.SCRAPED &&
            old.pages.some((page) =>
              page.feeds.some((cachedFeed) => cachedFeed.id === feed.id)
            );

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              feeds: shouldRemoveFromScraped
                  ? page.feeds.filter((cachedFeed) => cachedFeed.id !== feed.id)
                  : page.feeds.map((cachedFeed) =>
                      cachedFeed.id === feed.id
                        ? { ...cachedFeed, is_scraped: !feed.is_scraped }
                        : cachedFeed
                    ),
              totalCount: shouldRemoveFromScraped
                  ? Math.max(0, page.totalCount - 1)
                  : page.totalCount,
              totalPages: shouldRemoveFromScraped
                  ? Math.ceil(Math.max(0, page.totalCount - 1) / cachedLimit)
                  : page.totalPages,
            })),
          };
        });
      });

      return { snapshots };
    },
    onError: (error: Error, _feed, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      console.error("스크랩 처리 중 오류:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feeds"],
      });
    },
  });

  const handleScrap = useCallback(
    async (feed: Feed) => {
      if (!user) return router.push(ROUTE_PATH.LOGIN);

      // 중복 클릭 방지
      if (scrapMutation.isPending) return;

      try {
        await scrapMutation.mutateAsync(feed);
      } catch {
        // onError에서 캐시 복원과 오류 기록을 처리합니다.
      }
    },
    [user, router, scrapMutation]
  );

  const handleChangeTab = useCallback((tab: FeedCategory) => {
    setActiveTab(tab);
  }, []);

  return {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    feeds: uniqueFeeds,
    activeTab,
    handleScrap,
    handleChangeTab,
    fetchNextPage,
    refetch,
    error,
  };
};
