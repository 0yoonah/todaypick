import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTE_PATH } from "@/config/constants";
import { CS_CATEGORIES, type CsCategory } from "@/types/cs";
import { getCsCategoryLabel } from "@/utils/csUtils";

interface CsCategoryFilterProps {
  value?: CsCategory;
}

const buildHref = (category?: CsCategory) =>
  category ? `${ROUTE_PATH.CS}?category=${category}` : ROUTE_PATH.CS;

/** 분야 필터는 링크라 자바스크립트 없이도 동작한다. */
export default function CsCategoryFilter({ value }: CsCategoryFilterProps) {
  const items: { key: string; label: string; category?: CsCategory }[] = [
    { key: "all", label: "전체" },
    ...CS_CATEGORIES.map((category) => ({
      key: category,
      label: getCsCategoryLabel(category),
      category,
    })),
  ];

  return (
    <div
      className="mb-7 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
      role="group"
      aria-label="CS 지식 분야 필터"
    >
      {items.map((item) => {
        const isActive = value === item.category;

        return (
          <Link
            key={item.key}
            href={buildHref(item.category)}
            aria-current={isActive ? "true" : undefined}
            scroll={false}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
