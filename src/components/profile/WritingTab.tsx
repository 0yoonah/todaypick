"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { INTERESTS, type InterestId } from "@/config/interests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WritingDraft } from "@/types/writing";

async function fetchDrafts(): Promise<WritingDraft[]> {
  const response = await fetch("/api/writing-drafts");
  if (!response.ok) throw new Error("글 초안을 불러오지 못했습니다.");
  const result = await response.json();
  return result.drafts;
}

export default function WritingTab({ initialDraft }: { initialDraft?: WritingDraft | null }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["writing-drafts"], queryFn: fetchDrafts });
  const [editing, setEditing] = useState<WritingDraft | null>(initialDraft ?? null);
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [content, setContent] = useState(initialDraft?.content ?? "");
  const [tags, setTags] = useState<InterestId[]>(initialDraft?.tags ?? []);

  const openDraft = (draft: WritingDraft) => {
    setEditing(draft);
    setTitle(draft.title);
    setContent(draft.content);
    setTags(draft.tags);
  };

  const isDirty = Boolean(
    editing &&
      (title !== editing.title ||
        content !== editing.content ||
        tags.join(",") !== editing.tags.join(","))
  );

  useEffect(() => {
    const protectUnsavedDraft = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", protectUnsavedDraft);
    return () => window.removeEventListener("beforeunload", protectUnsavedDraft);
  }, [isDirty]);

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const response = await fetch("/api/writing-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, title, content, tags, sources: editing.sources }),
      });
      if (!response.ok) throw new Error("초안을 저장하지 못했습니다.");
      return response.json() as Promise<WritingDraft>;
    },
    onSuccess: async (draft) => {
      if (draft) setEditing(draft);
      await queryClient.invalidateQueries({ queryKey: ["writing-drafts"] });
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/writing-drafts?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("초안을 삭제하지 못했습니다.");
      return id;
    },
    onSuccess: async (id) => {
      if (editing?.id === id) setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["writing-drafts"] });
    },
  });

  if (query.isLoading) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-56" /></div>;
  if (query.isError) return <p className="py-10 text-center text-sm text-muted-foreground">글 초안을 불러오지 못했습니다.</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]">
      <section>
        <div className="mb-3">
          <h2 className="font-bold">글 초안</h2>
          <p className="mt-1 text-xs text-muted-foreground">읽은 글 탭에서 참고할 글을 선택해 새 글을 시작하세요.</p>
        </div>
        {query.data?.length ? (
          <ul className="divide-y border-y">
            {query.data.map((draft) => (
              <li key={draft.id} className="flex items-center gap-2 py-3">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDraft(draft)}>
                  <span className="block truncate text-sm font-semibold">{draft.title || "제목 없는 글"}</span>
                  <span className="text-xs text-muted-foreground">참고 글 {draft.sources.length}개</span>
                </button>
                <Button variant="ghost" size="icon" aria-label="초안 삭제" onClick={() => deleteDraft.mutate(draft.id)}><FiTrash2 /></Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">작성 중인 글이 없어요.</p>
        )}
      </section>

      <section className="min-w-0">
        {editing ? (
          <div className="space-y-4 rounded-xl border p-5">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="flex items-center gap-2 font-bold"><FiEdit3 />글 초안 편집</h2><p className="mt-1 text-xs text-muted-foreground">{isDirty ? "저장되지 않은 변경 사항이 있어요." : "모든 변경 사항이 저장됐어요."}</p></div>
              <Button size="sm" disabled={saveDraft.isPending || !isDirty} onClick={() => saveDraft.mutate()}>{saveDraft.isPending ? "저장 중..." : "저장"}</Button>
            </div>
            <Input value={title} maxLength={200} placeholder="글 제목" onChange={(event) => setTitle(event.target.value)} />
            <textarea value={content} maxLength={50000} placeholder="선택한 글을 참고해 Markdown으로 생각을 정리해 보세요." onChange={(event) => setContent(event.target.value)} className="min-h-80 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <div><p className="mb-2 text-xs font-semibold text-muted-foreground">관심 분야 태그</p><div className="flex flex-wrap gap-2">{INTERESTS.map((interest) => { const selected = tags.includes(interest.id); return <button key={interest.id} type="button" onClick={() => setTags((current) => selected ? current.filter((id) => id !== interest.id) : [...current, interest.id])} className={cn("rounded-full border px-3 py-1 text-xs", selected ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")}>{interest.label}</button>; })}</div></div>
            {editing.sources.length > 0 && <div><p className="mb-2 text-xs font-semibold text-muted-foreground">참고한 글</p><ul className="space-y-1">{editing.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="line-clamp-1 text-sm text-primary hover:underline">{source.title}</a></li>)}</ul></div>}
            <p className="text-right text-xs text-muted-foreground">마지막 저장 {new Date(editing.updated_at).toLocaleString("ko-KR")}</p>
            {saveDraft.error && <p className="text-sm text-destructive">{saveDraft.error.message}</p>}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed text-center"><FiEdit3 className="size-8 text-muted-foreground" /><p className="mt-3 font-semibold">편집할 초안을 선택하세요</p><p className="mt-1 text-sm text-muted-foreground">새 글은 읽은 글을 선택해 시작할 수 있어요.</p></div>
        )}
      </section>
    </div>
  );
}
