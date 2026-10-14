"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CursorFeedPage, Feed, FeedCategory, RSSFeedCategory } from "@/types/feed";
import type { InterestId } from "@/config/interests";
import { FEED_CATEGORY, ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { feedService } from "@/services/feedService";
import {
  type InfiniteFeedData,
  type FeedPage,
  type FeedPageParam,
  buildFeedRequestParams,
  getNextFeedPageParam,
  updateFeedScrapCache,
} from "@/utils/feedCacheUtils";

interface UseInfiniteFeedProps {
  category: FeedCategory;
  limit: number;
  interest?: InterestId;
  sourceCategory?: RSSFeedCategory;
  /** 제목 검색어. IT 뉴스·테크 블로그에서만 쓴다. */
  query?: string;
  /**
   * 서버에서 미리 조회한 첫 페이지. 호출하는 쪽이 category·interest·limit이 같을 때만 넘긴다.
   * 있으면 첫 페이지를 다시 요청하지 않고, 다음 페이지부터 커서로 요청한다.
   */
  initialPage?: CursorFeedPage;
  enabled?: boolean;
}

type FeedQuerySnapshot = [readonly unknown[], InfiniteFeedData | undefined];

const fetchFeeds = async ({
  category,
  pageParam,
  limit,
  interest,
  sourceCategory,
  query,
}: {
  category: FeedCategory;
  pageParam: FeedPageParam;
  limit: number;
  interest?: InterestId;
  sourceCategory?: RSSFeedCategory;
  query?: string;
}) => {
  const params = buildFeedRequestParams({
    category,
    limit,
    pageParam,
    interest,
    sourceCategory,
    query,
  });

  const response = await fetch(`/api/feeds?${params}`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "피드를 불러오는데 실패했습니다.");
  }

  return response.json() as Promise<FeedPage>;
};

export const useInfiniteFeed = ({
  category,
  limit,
  interest,
  sourceCategory,
  query,
  initialPage,
  enabled = true,
}: UseInfiniteFeedProps) => {
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
    queryKey: [
      "feeds",
      activeTab,
      limit,
      user?.id,
      interest ?? "all",
      sourceCategory ?? "all",
      query ?? "",
    ],
    queryFn: ({ pageParam }) =>
      fetchFeeds({
        category: activeTab,
        pageParam,
        limit,
        interest,
        sourceCategory,
        query,
      }),
    enabled,
    // 스크랩 탭은 페이지 번호, IT 뉴스·테크 블로그는 커서로 이어 읽는다. 첫 커서는 없음(null)이다.
    initialPageParam: (activeTab === FEED_CATEGORY.SCRAPED ? 1 : null) as FeedPageParam,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    getNextPageParam: getNextFeedPageParam,
    // 탭을 바꾸거나 검색하면 다른 목록이라 서버에서 받은 첫 페이지를 쓰지 않는다.
    initialData:
      initialPage && activeTab === category && !query
        ? { pages: [initialPage], pageParams: [null] }
        : undefined,
  });

  const uniqueFeeds = useMemo(() => {
    const feedsById = new Map<string, Feed>();
    for (const feed of data?.pages.flatMap((page) => page.feeds) ?? []) {
      if (!feedsById.has(feed.id)) feedsById.set(feed.id, feed);
    }
    return [...feedsById.values()];
  }, [data?.pages]);

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
          return updateFeedScrapCache(
            old,
            feed,
            cachedCategory,
            cachedLimit
          );
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
