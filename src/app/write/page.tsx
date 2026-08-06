"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import WriteEditor from "@/components/write/WriteEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PROFILE_TAB, ROUTE_PATH } from "@/config/constants";
import type { WritingDraft } from "@/types/writing";

async function fetchDrafts(): Promise<WritingDraft[]> {
  const response = await fetch("/api/writing-drafts");
  if (!response.ok) throw new Error("글 초안을 불러오지 못했습니다.");
  const result = await response.json();
  return result.drafts;
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const startAsPublic = searchParams.get("newDraft") === "true";
  const query = useQuery({
    queryKey: ["writing-drafts"],
    queryFn: fetchDrafts,
  });

  const initialDraft = useMemo(() => {
    if (!draftId) return null;
    return query.data?.find((draft) => draft.id === draftId) ?? null;
  }, [draftId, query.data]);
  const isDraftNotFound = Boolean(
    draftId && query.isSuccess && !initialDraft
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-9">
          <p className="mb-3 text-sm font-semibold text-primary">글쓰기</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            {isDraftNotFound ? "글을 찾을 수 없어요" : "생각을 글로 남기기"}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {isDraftNotFound
              ? "이미 삭제됐거나 접근할 수 없는 글입니다."
              : "바로 에디터에서 글을 작성하고 썸네일까지 등록해보세요."}
          </p>
        </div>

        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-[40rem]" />
          </div>
        ) : query.isError ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            글 초안을 불러오지 못했습니다.
          </p>
        ) : isDraftNotFound ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              수정하려는 글을 찾지 못해 에디터를 열지 않았습니다. 새 글을
              시작하거나 내가 쓴 글에서 다시 확인해보세요.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={ROUTE_PATH.WRITE}>새 글 쓰기</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`${ROUTE_PATH.PROFILE}?tab=${PROFILE_TAB.WRITING}`}>
                  내가 쓴 글 보기
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <WriteEditor
            initialDraft={initialDraft}
            startAsPublic={startAsPublic}
          />
        )}
      </div>
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense>
      <WritePageContent />
    </Suspense>
  );
}
