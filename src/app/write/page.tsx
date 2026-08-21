"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import WriteEditor from "@/components/write/WriteEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PROFILE_TAB, ROUTE_PATH } from "@/config/constants";
import { ownWritingDraftQueryKey } from "@/utils/writingUtils";
import type { WritingDraft } from "@/types/writing";

/** 조회 실패 원인을 상태 코드로 구분하기 위한 오류 */
class DraftFetchError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "DraftFetchError";
  }
}

const NOT_FOUND_STATUSES = [401, 404];

async function fetchOwnDraft(draftId: string): Promise<WritingDraft> {
  const response = await fetch(
    `/api/writing-drafts?id=${encodeURIComponent(draftId)}&scope=mine`
  );
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DraftFetchError(
      result?.error || "글을 불러오지 못했습니다.",
      response.status
    );
  }

  return result.draft as WritingDraft;
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const query = useQuery({
    queryKey: ownWritingDraftQueryKey(draftId ?? ""),
    queryFn: () => fetchOwnDraft(draftId as string),
    enabled: Boolean(draftId),
    retry: (failureCount, error) =>
      !(
        error instanceof DraftFetchError &&
        NOT_FOUND_STATUSES.includes(error.status)
      ) && failureCount < 2,
  });

  const initialDraft = draftId ? query.data ?? null : null;
  const isDraftNotFound =
    query.error instanceof DraftFetchError &&
    NOT_FOUND_STATUSES.includes(query.error.status);
  const isLoadingDraft = Boolean(draftId) && query.isLoading;
  const isDraftError = Boolean(query.error) && !isDraftNotFound;

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

        {isLoadingDraft ? (
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-[40rem]" />
          </div>
        ) : isDraftError ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {query.error?.message || "글을 불러오지 못했습니다."}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              다시 시도
            </Button>
          </div>
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
          <WriteEditor initialDraft={initialDraft} />
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
