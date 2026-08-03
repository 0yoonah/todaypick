"use client";

import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import WriteEditor from "@/components/write/WriteEditor";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-9">
          <p className="mb-3 text-sm font-semibold text-primary">글쓰기</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            생각을 글로 남기기
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            바로 에디터에서 글을 작성하고 썸네일까지 등록해보세요.
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
