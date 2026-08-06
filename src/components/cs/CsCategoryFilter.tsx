"use client";

import { cn } from "@/lib/utils";
import { CS_CATEGORIES, type CsCategory } from "@/types/cs";
import { getCsCategoryLabel } from "@/utils/csUtils";

interface CsCategoryFilterProps {
  value?: CsCategory;
  onChange: (category?: CsCategory) => void;
}

export default function CsCategoryFilter({
  value,
  onChange,
}: CsCategoryFilterProps) {
  return (
    <div
      className="mb-7 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
      role="group"
      aria-label="CS 지식 분야 필터"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          !value
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:text-foreground"
        )}
      >
        전체
      </button>
      {CS_CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          aria-pressed={value === category}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            value === category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {getCsCategoryLabel(category)}
        </button>
      ))}
    </div>
  );
}
