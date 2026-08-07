import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { ROUTE_PATH } from "@/config/constants";
import type { GlossaryTerm } from "@/types/glossary";

interface GlossaryTermListProps {
  terms: GlossaryTerm[];
}

/** 목록에서는 표제어와 짧은 설명만 보여주고 상세는 개별 페이지에서 다룬다. */
export default function GlossaryTermList({ terms }: GlossaryTermListProps) {
  return (
    <ul className="-mx-4 divide-y border-y">
      {terms.map((term) => (
        <li key={term.id}>
          <Link
            href={`${ROUTE_PATH.GLOSSARY}/${term.id}`}
            className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">
                {term.term}
              </span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {term.definition}
              </span>
            </div>
            <FiChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
