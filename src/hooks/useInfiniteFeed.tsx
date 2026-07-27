"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Feed, FeedCategory } from "@/types/feed";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { feedService } from "@/services/feedService";

interface UseInfiniteFeedProps {
  category: FeedCategory;
  limit: number;
}

interface FeedPage {
  feeds: Feed[];
  currentPage: number;
  totalPages: number;
}
interface InfiniteFeedData {
  pages: FeedPage[];
  pageParams: number[];
}

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
  return response.json();
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
        queryKey: ["feeds", activeTab, limit, user?.id],
      });

      // 이전 데이터 백업 (롤백용)
      const previousFeeds = queryClient.getQueryData([
        "feeds",
        activeTab,
        limit,
        user?.id,
      ]);

      // 낙관적으로 UI 업데이트
      queryClient.setQueryData<InfiniteFeedData>(
        ["feeds", activeTab, limit, user?.id],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              feeds: page.feeds.map((f: Feed) =>
                f.id === feed.id ? { ...f, is_scraped: !f.is_scraped } : f
              ),
            })),
          };
        }
      );

      // 롤백용 데이터 반환
      return { previousFeeds };
    },
    onError: (error: Error) => {
      console.error("스크랩 처리 중 오류:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feeds", activeTab, limit, user?.id],
      });
    },
  });

  const handleScrap = useCallback(
    async (feed: Feed) => {
      if (!user) return router.push(ROUTE_PATH.LOGIN);

      // 중복 클릭 방지
      if (scrapMutation.isPending) return;

      await scrapMutation.mutateAsync(feed);
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
