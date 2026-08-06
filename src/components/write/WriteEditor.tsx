"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiExternalLink, FiImage, FiLink, FiSave, FiX } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTERESTS, type InterestId } from "@/config/interests";
import { PROFILE_TAB, ROUTE_PATH } from "@/config/constants";
import { cn } from "@/lib/utils";
import {
  createWritingFormSnapshot,
  DEFAULT_WRITING_VISIBILITY,
  hasWritingFormChanges,
} from "@/utils/writingUtils";
import type {
  WritingDraft,
  WritingSource,
  WritingVisibility,
} from "@/types/writing";

type WriteEditorProps = {
  initialDraft?: WritingDraft | null;
  startAsPublic?: boolean;
};

const EMPTY_DRAFT: WritingDraft | null = null;

export default function WriteEditor({
  initialDraft,
  startAsPublic = false,
}: WriteEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<WritingDraft | null>(
    initialDraft ?? EMPTY_DRAFT
  );
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [content, setContent] = useState(initialDraft?.content ?? "");
  const [tags, setTags] = useState<InterestId[]>(initialDraft?.tags ?? []);
  const [sources, setSources] = useState<WritingSource[]>(
    initialDraft?.sources ?? []
  );
  const [visibility, setVisibility] = useState<WritingVisibility>(
    startAsPublic
      ? DEFAULT_WRITING_VISIBILITY
      : initialDraft?.visibility ?? DEFAULT_WRITING_VISIBILITY
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialDraft?.thumbnail_url ?? null
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialDraft?.thumbnail_url ?? null
  );

  const initialSnapshot = useMemo(
    () =>
      createWritingFormSnapshot(
        editing,
        startAsPublic && !editing
          ? DEFAULT_WRITING_VISIBILITY
          : editing?.visibility ?? DEFAULT_WRITING_VISIBILITY
      ),
    [editing, startAsPublic]
  );

  const isDirty = hasWritingFormChanges(
    initialSnapshot,
    {
      title,
      content,
      tags,
      visibility,
      sourceIds: sources.map((source) => source.id),
      thumbnailUrl,
    },
    Boolean(thumbnailFile)
  );

  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const visibilityTabs = useMemo(
    () => [
      { id: "private" as const, label: "비공개" },
      { id: "public" as const, label: "공개" },
    ],
    []
  );

  const saveDraft = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (editing?.id) formData.append("id", editing.id);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      formData.append("visibility", visibility);
      formData.append("sources", JSON.stringify(sources));
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
      if (thumbnailUrl && !thumbnailFile) {
        formData.append("thumbnail_url", thumbnailUrl);
      }

      const response = await fetch("/api/writing-drafts", {
        method: editing?.id ? "PUT" : "POST",
        body: formData,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "글 초안을 저장하지 못했습니다.");
      }
      return result as WritingDraft;
    },
    onSuccess: async (draft) => {
      setEditing(draft);
      setThumbnailUrl(draft.thumbnail_url ?? null);
      setThumbnailFile(null);
      setThumbnailPreview(draft.thumbnail_url ?? null);
      await queryClient.invalidateQueries({ queryKey: ["writing-drafts"] });
      router.push(
        draft.visibility === "public"
          ? `${ROUTE_PATH.FEEDS}?category=writing`
          : `${ROUTE_PATH.PROFILE}?tab=${PROFILE_TAB.WRITING}`
      );
    },
  });

  const handleSelectThumbnail = (file: File | null) => {
    setThumbnailFile(file);
    if (thumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    if (!file) {
      setThumbnailPreview(thumbnailUrl);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-full border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label="퍼블리싱 공개 여부"
          >
            {visibilityTabs.map((tab) => {
              const isActive = visibility === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setVisibility(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <Badge
            variant={visibility === "public" ? "success" : "secondary"}
            className="ml-auto"
          >
            {visibility === "public" ? "공개 게시" : "비공개 보관"}
          </Badge>
          <Button
            size="sm"
            disabled={saveDraft.isPending || !isDirty}
            onClick={() => saveDraft.mutate()}
          >
            <FiSave aria-hidden />
            {saveDraft.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {sources.length > 0 && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiLink aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">이 글에서 인용하는 원문</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                원문이 참고 자료로 연결됐어요. 작성한 게시글 상세에서도 함께 표시됩니다.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{source.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {source.source}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${source.title} 원문 열기`}
                  >
                    <FiExternalLink aria-hidden />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSources((current) =>
                      current.filter((item) => item.id !== source.id)
                    )
                  }
                  aria-label={`${source.title} 인용 해제`}
                >
                  <FiX aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
          <Input
            value={title}
            maxLength={200}
            placeholder="글 제목"
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            value={content}
            maxLength={50000}
            placeholder="생각을 Markdown으로 정리해 보세요."
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[28rem] w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              관심 분야 태그
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const selected = tags.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() =>
                      setTags((current) =>
                        selected
                          ? current.filter((id) => id !== interest.id)
                          : [...current, interest.id]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-semibold">썸네일 이미지</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <FiImage aria-hidden />
              <span>이미지 선택</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  handleSelectThumbnail(file);
                }}
              />
            </label>
          </div>
          <div className="overflow-hidden rounded-xl border bg-muted/30">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailPreview}
                alt="썸네일 미리보기"
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-sm text-muted-foreground">
                미리보기 없음
              </div>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            공개 글만 피드의 게시글 탭에 노출돼요. 비공개 글은 프로필의
            내가 쓴 글에만 남습니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
