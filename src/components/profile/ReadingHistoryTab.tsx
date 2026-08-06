"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { FiClock, FiEdit3, FiInfo, FiTrash2 } from "react-icons/fi";
import type { FeedReadPage } from "@/types/feed";
import type { WritingDraft } from "@/types/writing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScrollTrigger from "@/components/feed/InfiniteScrollTrigger";
import { addDaysToDateKey, getSeoulDateKey } from "@/utils/dateUtils";
import { STATISTICS_QUERY_KEY } from "@/utils/profileUtils";

const PAGE_SIZE = 20;

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

const formatReadDate = (value: string) => {
  const today = getSeoulDateKey();
  if (value === today) return "오늘";
  if (value === addDaysToDateKey(today, -1)) return "어제";

  const currentYear = Number(today.slice(0, 4));
  const valueYear = Number(value.slice(0, 4));

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    ...(valueYear !== currentYear && { year: "numeric" }),
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00+09:00`));
};

export default function ReadingHistoryTab({
  onStartWriting,
}: {
  onStartWriting: (draftId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    mutationFn: async (ids: string[]) => {
      for (let index = 0; index < ids.length; index += 50) {
        const response = await fetch("/api/feed-reads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(index, index + 50) }),
        });
        if (!response.ok) {
          throw new Error("읽은 글 기록을 삭제하지 못했습니다.");
        }
      }
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["feed-reads"] });
      queryClient.invalidateQueries({ queryKey: ["daily-activities"] });
      queryClient.invalidateQueries({ queryKey: STATISTICS_QUERY_KEY });
    },
  });
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      const sources = reads
        .filter((read) => selectedIds.has(read.id))
        .map(({ feed }) => feed);
      const response = await fetch("/api/writing-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          content: "",
          tags: [],
          visibility: "private",
          sources,
        }),
      });
      if (!response.ok) throw new Error("글 초안을 만들지 못했습니다.");
      return response.json() as Promise<WritingDraft>;
    },
    onSuccess: (draft) => {
      setSelectedIds(new Set());
      queryClient.setQueryData<WritingDraft[]>(["writing-drafts"], (drafts) => [
        draft,
        ...(drafts?.filter((item) => item.id !== draft.id) ?? []),
      ]);
      onStartWriting(draft.id);
    },
  });

  const reads = query.data?.pages.flatMap((page) => page.reads) ?? [];
  const readsByDate = reads.reduce<Map<string, typeof reads>>(
    (groups, read) => {
      const dateReads = groups.get(read.read_date) ?? [];
      dateReads.push(read);
      groups.set(read.read_date, dateReads);
      return groups;
    },
    new Map()
  );
  const allVisibleSelected =
    reads.length > 0 && reads.every((read) => selectedIds.has(read.id));

  const toggleRead = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) reads.forEach((read) => next.delete(read.id));
      else reads.forEach((read) => next.add(read.id));
      return next;
    });
  };

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
      <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FiInfo className="size-4" aria-hidden />
        </span>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          최근 30일 동안 읽은 글을 최대 100개까지 보여드려요.
        </p>
      </div>
      <div className="flex min-h-10 items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-primary"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
          />
          현재 목록 전체 선택
        </label>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={createDraftMutation.isPending}
              onClick={() => createDraftMutation.mutate()}
            >
              <FiEdit3 aria-hidden />
              {createDraftMutation.isPending
                ? "초안 만드는 중..."
                : `${selectedIds.size}개 글로 쓰기`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate([...selectedIds])}
            >
              <FiTrash2 aria-hidden />
              {deleteMutation.isPending
                ? "삭제하는 중..."
                : `${selectedIds.size}개 삭제`}
            </Button>
          </div>
        )}
      </div>
      {createDraftMutation.error && (
        <p className="text-sm text-destructive">{createDraftMutation.error.message}</p>
      )}
      {[...readsByDate].map(([date, dateReads]) => (
        <section key={date} aria-labelledby={`read-date-${date}`}>
          <h2
            id={`read-date-${date}`}
            className="mb-1 text-sm font-semibold text-muted-foreground"
          >
            {formatReadDate(date)}
          </h2>
          <ul>
            {dateReads.map((read) => (
              <li key={read.id} className="border-b border-border">
                <div className="flex items-start justify-between gap-4 py-5">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
                    checked={selectedIds.has(read.id)}
                    onChange={() => toggleRead(read.id)}
                    aria-label={`${read.feed.title} 선택`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{read.feed.source || "출처 없음"}</span>
                      {read.read_count > 1 && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {read.read_count}회 읽음
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold leading-snug">
                      <Link
                        href={read.feed.url}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {read.feed.title}
                      </Link>
                    </h3>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <InfiniteScrollTrigger
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
}
