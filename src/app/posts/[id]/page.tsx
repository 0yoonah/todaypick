"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTE_PATH } from "@/config/constants";
import { DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import { useAuthStore } from "@/stores/authStore";
import type { WritingDraft } from "@/types/writing";

async function fetchDraft(id: string): Promise<WritingDraft> {
  const response = await fetch(`/api/writing-drafts?id=${id}`);
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "게시글을 불러오지 못했습니다.");
  }
  return result.draft;
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const query = useQuery({
    queryKey: ["writing-draft", params.id],
    queryFn: () => fetchDraft(params.id),
    enabled: Boolean(params.id),
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
      return result.is_bookmarked as boolean;
    },
    onSuccess: (isBookmarked) => {
      queryClient.setQueryData<WritingDraft>(
        ["writing-draft", params.id],
        (draft) => draft ? { ...draft, is_bookmarked: isBookmarked } : draft
      );
      queryClient.setQueryData<WritingDraft[]>(
        ["writing-drafts", "public"],
        (drafts) =>
          drafts?.map((draft) =>
            draft.id === params.id
              ? { ...draft, is_bookmarked: isBookmarked }
              : draft
          )
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
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
          <Skeleton className="h-[34rem] rounded-2xl" />
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">
              {query.error?.message || "게시글을 찾을 수 없어요."}
            </p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href={ROUTE_PATH.FEEDS}>피드로 돌아가기</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const draft = query.data;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary">게시글 상세</p>
            <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {draft.title || "제목 없는 글"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant={draft.visibility === "public" ? "success" : "secondary"}>
                {draft.visibility === "public" ? "공개" : "비공개"}
              </Badge>
              <span>{draft.author_name || "TodayPick 사용자"}</span>
              <span>
                {new Date(draft.updated_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft.visibility === "public" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBookmark(draft)}
                disabled={bookmarkMutation.isPending}
                aria-label={draft.is_bookmarked ? "게시글 북마크 해제" : "게시글 북마크 추가"}
              >
                {draft.is_bookmarked ? (
                  <GoBookmarkFill className="text-primary" />
                ) : (
                  <GoBookmark />
                )}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={ROUTE_PATH.FEEDS}>목록으로</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative aspect-[16/8] w-full bg-muted">
            <Image
              src={draft.thumbnail_url || DEFAULT_FEED_IMAGE_URL}
              alt={draft.title || "게시글 썸네일"}
              fill
              className="object-cover"
              priority
            />
          </div>
          <article className="max-w-none text-base leading-8 text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="mt-10 mb-4 text-3xl font-bold tracking-tight">{children}</h1>,
                h2: ({ children }) => <h2 className="mt-9 mb-3 text-2xl font-bold tracking-tight">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-8 mb-3 text-xl font-semibold">{children}</h3>,
                p: ({ children }) => <p className="my-4 leading-8">{children}</p>,
                ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>,
                ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>,
                blockquote: ({ children }) => <blockquote className="my-6 border-l-4 border-primary/40 pl-4 text-muted-foreground">{children}</blockquote>,
                a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">{children}</a>,
                code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>,
                pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">{children}</pre>,
                table: ({ children }) => <div className="my-6 overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
                th: ({ children }) => <th className="border bg-muted px-3 py-2 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border px-3 py-2 align-top">{children}</td>,
                hr: () => <hr className="my-8 border-border" />,
              }}
            >
              {draft.content || "아직 작성 내용이 없어요."}
            </ReactMarkdown>
          </article>

          {draft.sources.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">참고한 글</h2>
              <ul className="space-y-2">
                {draft.sources.map((source) => (
                  <li
                    key={source.id}
                    className="rounded-xl border bg-muted/30 px-4 py-3"
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:underline"
                    >
                      {source.title}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {source.source}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
