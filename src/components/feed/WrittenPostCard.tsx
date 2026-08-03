"use client";

import Image from "next/image";
import Link from "next/link";
import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import { ROUTE_PATH } from "@/config/constants";
import type { WritingDraft } from "@/types/writing";

interface WrittenPostCardProps {
  draft: WritingDraft;
  onBookmark: (draft: WritingDraft) => void;
  bookmarkPending?: boolean;
}

export default function WrittenPostCard({
  draft,
  onBookmark,
  bookmarkPending = false,
}: WrittenPostCardProps) {
  return (
    <div className="relative h-full w-full min-w-0">
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        className="absolute right-3 top-3 z-20 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-sm transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:size-9"
        onClick={() => onBookmark(draft)}
        disabled={bookmarkPending}
        aria-label={draft.is_bookmarked ? "게시글 북마크 해제" : "게시글 북마크 추가"}
      >
        {draft.is_bookmarked ? (
          <GoBookmarkFill className="text-lg text-primary" />
        ) : (
          <GoBookmark className="text-lg" />
        )}
      </button>
    </div>
  );
}
