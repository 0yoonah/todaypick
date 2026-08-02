"use client";

import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiClock, FiTrash2 } from "react-icons/fi";
import type { FeedReadPage } from "@/types/feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 12;

const fetchFeedReads = async (page: number) => {
  const response = await fetch(
    `/api/feed-reads?page=${page}&limit=${PAGE_SIZE}`
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "읽은 글을 불러오지 못했습니다.");
  }
  return result as FeedReadPage;
};

const formatReadTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function ReadingHistoryTab() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["feed-reads"],
    queryFn: ({ pageParam }) => fetchFeedReads(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined,
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/feed-reads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("읽은 글 기록을 삭제하지 못했습니다.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed-reads"] }),
  });

  const reads = query.data?.pages.flatMap((page) => page.reads) ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-3" aria-label="읽은 글을 불러오는 중">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="font-semibold">{query.error.message}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (reads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <FiClock className="h-8 w-8 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-semibold">아직 읽은 글이 없습니다.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              피드에서 원문을 열면 여기에 읽은 기록이 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ul aria-label="읽은 글 히스토리">
        {reads.map((read) => (
          <li key={read.id} className="border-b border-border">
            <div className="flex items-start justify-between gap-4 py-5">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{read.feed.source || "출처 없음"}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={read.last_read_at}>
                    최근 {formatReadTime(read.last_read_at)}
                  </time>
                  {read.read_count > 1 && (
                    <>
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {read.read_count}회 읽음
                      </span>
                      <span>최초 {formatReadTime(read.first_read_at)}</span>
                    </>
                  )}
                </div>
                <h2 className="font-semibold leading-snug">
                  <Link
                    href={read.feed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {read.feed.title}
                  </Link>
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`${read.feed.title} 읽기 기록 삭제`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(read.id)}
              >
                <FiTrash2 aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}
