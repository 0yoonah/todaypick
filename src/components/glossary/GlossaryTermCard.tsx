import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTE_PATH } from "@/config/constants";
import { getCsCategoryColor, getCsCategoryLabel } from "@/utils/csUtils";
import type { GlossaryTerm } from "@/types/glossary";

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  related: GlossaryTerm[];
}

/** 정적 데이터만 표시하므로 서버에서 렌더링한다. */
export default function GlossaryTermCard({
  term,
  related,
}: GlossaryTermCardProps) {
  return (
    <Card id={term.id} className="w-full shadow-none scroll-mt-24">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-card-foreground sm:text-lg">
            {term.term}
          </h2>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              getCsCategoryColor(term.category)
            )}
          >
            {getCsCategoryLabel(term.category)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {term.definition}
        </p>

        {term.aliases.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold">다른 표기</span>{" "}
            {term.aliases.join(", ")}
          </p>
        )}

        {related.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              관련 용어
            </span>
            {related.map((item) => (
              <Link
                key={item.id}
                href={`${ROUTE_PATH.GLOSSARY}?q=${encodeURIComponent(item.term)}`}
                className="cursor-pointer rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.term}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
