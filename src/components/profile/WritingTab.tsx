"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTE_PATH } from "@/config/constants";
import type { WritingDraft } from "@/types/writing";

const EMPTY_DRAFTS: WritingDraft[] = [];

async function fetchDrafts(): Promise<WritingDraft[]> {
  const response = await fetch("/api/writing-drafts");
  if (!response.ok) throw new Error("글 초안을 불러오지 못했습니다.");
  const result = await response.json();
  return result.drafts;
}

export default function WritingTab() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["writing-drafts"], queryFn: fetchDrafts });
  const drafts = query.data ?? EMPTY_DRAFTS;

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/writing-drafts?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("초안을 삭제하지 못했습니다.");
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["writing-drafts"] });
    },
  });

  if (query.isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-56" />
      </div>
    );
  if (query.isError)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        글 초안을 불러오지 못했습니다.
      </p>
    );

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-bold">내가 쓴 글</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          비공개 글은 여기서만 보이고, 공개 글은 게시글 탭에도 노출돼요.
        </p>
      </div>
      {drafts.length ? (
        <ul className="divide-y border-y">
          {drafts.map((draft) => (
            <li key={draft.id} className="flex items-center gap-2 py-3">
              <Link
                href={`${ROUTE_PATH.POSTS}/${draft.id}`}
                className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="block truncate text-sm font-semibold">
                  {draft.title || "제목 없는 글"}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant={
                      draft.visibility === "public" ? "success" : "secondary"
                    }
                  >
                    {draft.visibility === "public" ? "공개" : "비공개"}
                  </Badge>
                  <span>
                    참고 글 {draft.sources.length}개 ·{" "}
                    {new Date(draft.updated_at).toLocaleDateString("ko-KR", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                </span>
              </Link>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="글 수정"
              >
                <Link href={`${ROUTE_PATH.WRITE}?draftId=${draft.id}`}>
                  <FiEdit3 />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="초안 삭제"
                onClick={() => deleteDraft.mutate(draft.id)}
              >
                <FiTrash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          아직 작성한 글이 없어요. 글쓰기 페이지에서 초안을 시작해보세요.
        </p>
      )}
    </div>
  );
}
