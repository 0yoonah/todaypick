import { GoBookmark, GoBookmarkFill } from "react-icons/go";
import { FaCopy } from "react-icons/fa";
import { Quote } from "@/types/quote";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuoteCardProps {
  quote: Quote | null;
  isScraped: boolean;
  isCopied: boolean;
  compact?: boolean;
  handleScrap: () => void;
  handleCopyToClipboard: () => void;
}

export default function QuoteCard({
  quote,
  isScraped,
  isCopied,
  compact = false,
  handleScrap,
  handleCopyToClipboard,
}: QuoteCardProps) {
  if (!quote) return null;

  return (
    <Card className="relative mx-auto w-full overflow-hidden border-0 bg-secondary shadow-none">
      <button
        className={cn(
          "absolute z-10 flex items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:text-primary",
          compact
            ? "right-4 top-4 size-8"
            : "right-4 top-4 size-8 sm:right-5 sm:top-5 sm:size-9"
        )}
        onClick={handleScrap}
        aria-label={isScraped ? "스크랩 해제" : "스크랩 추가"}
      >
        {isScraped ? (
          <GoBookmarkFill className="text-lg text-primary" />
        ) : (
          <GoBookmark className="text-lg" />
        )}
      </button>

      <CardContent className="relative p-5 sm:p-6">
        <div
          className={cn(
            "flex flex-col justify-between",
            compact ? "gap-4 pr-10" : "min-h-40 gap-3 sm:min-h-56 sm:gap-0"
          )}
        >
          <span
            className={cn(
              "font-serif leading-none text-primary/30",
              compact ? "text-3xl" : "text-3xl sm:text-4xl"
            )}
            aria-hidden
          >
            “
          </span>
          <blockquote
            className={cn(
              "font-semibold leading-relaxed tracking-tight text-card-foreground",
              compact
                ? "text-base sm:text-lg"
                : "my-3 text-lg sm:my-4 sm:text-xl"
            )}
          >
            {quote.text}
          </blockquote>

          <div className="flex items-end justify-between gap-4">
            <cite className="text-sm font-medium not-italic text-muted-foreground">
              {quote.author}
            </cite>
            <Button
              onClick={handleCopyToClipboard}
              variant="ghost"
              size="sm"
              className={cn(
                "cursor-pointer",
                isCopied ? "text-success" : "text-muted-foreground"
              )}
              aria-label="복사하기"
            >
              <FaCopy />
              <span>{isCopied ? "복사됨" : "복사"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
