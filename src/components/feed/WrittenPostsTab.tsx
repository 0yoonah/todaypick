"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit3 } from "react-icons/fi";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import { ROUTE_PATH } from "@/config/constants";
import { DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import { useAuthStore } from "@/stores/authStore";
import type { WritingDraft } from "@/types/writing";

async function fetchDrafts(): Promise<WritingDraft[]> {
  const response = await fetch("/api/writing-drafts?scope=public");
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "글 목록을 불러오지 못했습니다.");
  }
  return result.drafts ?? [];
}

export default function WrittenPostsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const query = useQuery({
    queryKey: ["writing-drafts", "public"],
    queryFn: fetchDrafts,
  });
  const bookmarkMutation = useMutation({
    mutationFn: async (draft: WritingDraft) => {
      const response = await fetch(
        draft.is_bookmarked
          ? `/api/writing-bookmarks?draftId=${draft.id}`
          : "/api/writing-bookmarks",
        {
          method: draft.is_bookmarked ? "DELETE" : "POST",
          headers: draft.is_bookmarked
            ? undefined
            : { "Content-Type": "application/json" },
          body: draft.is_bookmarked
            ? undefined
            : JSON.stringify({ draft_id: draft.id }),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "북마크를 변경하지 못했습니다.");
      }
      return { draftId: draft.id, isBookmarked: result.is_bookmarked as boolean };
    },
    onSuccess: ({ draftId, isBookmarked }) => {
      queryClient.setQueryData<WritingDraft[]>(
        ["writing-drafts", "public"],
        (drafts) =>
          drafts?.map((draft) =>
            draft.id === draftId
              ? { ...draft, is_bookmarked: isBookmarked }
              : draft
          )
      );
      queryClient.setQueryData<WritingDraft>(
        ["writing-draft", draftId],
        (draft) => draft ? { ...draft, is_bookmarked: isBookmarked } : draft
      );
    },
  });

  const handleBookmark = (draft: WritingDraft) => {
    if (!user) {
      router.push(ROUTE_PATH.LOGIN);
      return;
    }
    if (!bookmarkMutation.isPending) bookmarkMutation.mutate(draft);
  };

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonFeedCard key={index} showActions={false} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="font-semibold">{query.error.message}</p>
          <Button asChild>
            <Link href={ROUTE_PATH.WRITE}>글쓰기 페이지로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!query.data || query.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <FiEdit3 className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-semibold">게시글이 아직 없어요.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              글쓰기 페이지에서 초안을 시작하면 여기에 모여 보여요.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTE_PATH.WRITE}>글쓰기 시작하기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const publicDrafts = query.data;

  if (publicDrafts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <FiEdit3 className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-semibold">공개 게시글이 아직 없어요.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              공개로 저장한 글만 이 탭에 카드 형태로 보여요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
      {publicDrafts.map((draft) => (
        <div key={draft.id} className="relative h-full w-full min-w-0">
          <Link
            href={`${ROUTE_PATH.POSTS}/${draft.id}`}
            className="group block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full w-full overflow-hidden border-0 bg-transparent py-0 shadow-none">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={draft.thumbnail_url || DEFAULT_FEED_IMAGE_URL}
                alt={draft.title || "게시글 썸네일"}
                fill
                className="object-cover transition-[opacity,scale] duration-500 ease-in-out group-hover:scale-105"
              />
            </div>

            <CardHeader className="px-0 pt-4 pb-2">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{draft.author_name || "TodayPick 사용자"}</span>
                <span aria-hidden>·</span>
                <span>
                  {new Date(draft.updated_at).toLocaleDateString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </div>
              <CardTitle className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.02em] text-card-foreground transition-colors group-hover:text-primary">
                {draft.title || "제목 없는 글"}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-0 pt-0">
              <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {draft.content || "아직 작성 내용이 없어요."}
              </p>
            </CardContent>
            </Card>
          </Link>
          <button
            type="button"
            className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-sm transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:size-9"
            onClick={() => handleBookmark(draft)}
            disabled={bookmarkMutation.isPending}
            aria-label={draft.is_bookmarked ? "게시글 북마크 해제" : "게시글 북마크 추가"}
          >
            {draft.is_bookmarked ? (
              <GoBookmarkFill className="text-lg text-primary" />
            ) : (
              <GoBookmark className="text-lg" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
