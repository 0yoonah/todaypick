"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { ROUTE_PATH } from "@/config/constants";
import type { CsCategory } from "@/types/cs";

interface GlossarySearchInputProps {
  /** 현재 URL에 반영된 검색어 */
  query: string;
  category?: CsCategory;
}

const DEBOUNCE_MS = 300;

const buildHref = (query: string, category?: CsCategory) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? `${ROUTE_PATH.GLOSSARY}?${search}` : ROUTE_PATH.GLOSSARY;
};

export default function GlossarySearchInput({
  query,
  category,
}: GlossarySearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);

  // 뒤로 가기 등으로 URL이 바뀌면 입력값을 맞춘다.
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setValue(query);
  }

  useEffect(() => {
    if (value.trim() === query.trim()) return;

    const timer = window.setTimeout(() => {
      router.replace(buildHref(value, category), { scroll: false });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, query, category, router]);

  return (
    <div className="relative mb-6">
      <FiSearch
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <label htmlFor="glossary-search" className="sr-only">
        용어 검색
      </label>
      <input
        id="glossary-search"
        type="search"
        value={value}
        placeholder="용어나 영문 표기로 검색해보세요"
        onChange={(event) => setValue(event.target.value)}
        className="h-11 w-full rounded-full border bg-background pl-9 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FiX className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
