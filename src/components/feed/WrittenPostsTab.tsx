"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit3 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonFeedCard from "@/components/feed/SkeletonFeedCard";
import WrittenPostCard from "@/components/feed/WrittenPostCard";
import { ROUTE_PATH } from "@/config/constants";
import { shouldPrioritizeImage } from "@/utils/imagePriorityUtils";
import { useAuthStore } from "@/stores/authStore";
import type { WritingDraft } from "@/types/writing";
import { INTERESTS, type InterestId } from "@/config/interests";

async function fetchDrafts(interest?: InterestId): Promise<WritingDraft[]> {
  const params = new URLSearchParams({ scope: "public" });
  if (interest) params.set("interest", interest);
  const response = await fetch(`/api/writing-drafts?${params}`);
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "글 목록을 불러오지 못했습니다.");
  }
  return result.drafts ?? [];
}

export default function WrittenPostsTab({ interest }: { interest?: InterestId }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const interestLabel = INTERESTS.find((item) => item.id === interest)?.label;
  const query = useQuery({
    queryKey: ["writing-drafts", "public", interest ?? "all"],
    queryFn: () => fetchDrafts(interest),
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
      queryClient.setQueriesData<WritingDraft[]>(
        { queryKey: ["writing-drafts", "public"] },
        (drafts) =>
          drafts?.map((draft) =>
            draft.id === draftId ? { ...draft, is_bookmarked: isBookmarked } : draft
          )
      );
      queryClient.invalidateQueries({ queryKey: ["writing-bookmarks"] });
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
            <h2 className="font-semibold">
              {interestLabel
                ? `${interestLabel} 분야의 게시글이 아직 없어요.`
                : "게시글이 아직 없어요."}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {interestLabel
                ? "다른 관심 분야를 선택하거나 새로운 글을 작성해보세요."
                : "글쓰기 페이지에서 초안을 시작하면 여기에 모여 보여요."}
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

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
      {publicDrafts.map((draft, index) => (
        <WrittenPostCard
          key={draft.id}
          draft={draft}
          onBookmark={handleBookmark}
          bookmarkPending={bookmarkMutation.isPending}
          priority={shouldPrioritizeImage(index)}
        />
      ))}
    </div>
  );
}
