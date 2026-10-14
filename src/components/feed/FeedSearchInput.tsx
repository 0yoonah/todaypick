"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export const FEED_SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 50;

interface FeedSearchInputProps {
  /** 입력을 멈춘 뒤 검색어를 알린다. 2글자 미만이면 빈 문자열이다. */
  onSearch: (query: string) => void;
}

export default function FeedSearchInput({ onSearch }: FeedSearchInputProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const query = nextValue.trim();
      onSearch(query.length >= MIN_QUERY_LENGTH ? query : "");
    }, FEED_SEARCH_DEBOUNCE_MS);
  };

  return (
    <div className="mb-4">
      <Input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="제목으로 검색 (2글자 이상)"
        aria-label="피드 제목 검색"
        className="h-10 sm:max-w-sm"
      />
    </div>
  );
}
