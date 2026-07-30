"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ScrapedQuote } from "@/types/quote";
import { ROUTE_PATH } from "@/config/constants";
import QuoteCard from "@/components/quote/QuoteCard";
import SkeletonQuoteCard from "@/components/quote/SkeletonQuoteCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ScrapedQuotesTab() {
  const [quotes, setQuotes] = useState<ScrapedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [pendingQuoteId, setPendingQuoteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchScrapedQuotes = async () => {
      try {
        const response = await fetch("/api/quotes");

        if (!response.ok) {
          throw new Error("스크랩된 명언을 불러오는데 실패했습니다.");
        }

        const data = await response.json();

        if (!cancelled) {
          setLoadError(false);
          setQuotes(
            data.map((quote: ScrapedQuote) => ({
              ...quote,
              is_scraped: true,
            }))
          );
        }
      } catch (err) {
        console.error(
          "스크랩된 명언을 불러오는 중 오류가 발생했습니다.",
          err
        );
        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchScrapedQuotes();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const handleCopyToClipboard = useCallback(async (quote: ScrapedQuote) => {
    const text = `"${quote.quote.text}" - ${quote.quote.author}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuoteId(quote.id);

      setTimeout(() => {
        setCopiedQuoteId((currentId) =>
          currentId === quote.id ? null : currentId
        );
      }, 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      alert("클립보드 복사에 실패했습니다.");
    }
  }, []);

  const handleUnscrap = useCallback(
    async (scrapedQuote: ScrapedQuote) => {
      if (pendingQuoteId) return;

      setPendingQuoteId(scrapedQuote.quote.id);

      try {
        const response = await fetch(
          `/api/quotes?quoteId=${encodeURIComponent(scrapedQuote.quote.id)}`,
          {
          method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "스크랩 해제에 실패했습니다.");
        }

        setQuotes((currentQuotes) =>
          currentQuotes.filter((quote) => quote.id !== scrapedQuote.id)
        );
      } catch (error) {
        console.error("스크랩 해제 실패:", error);
        alert(
          error instanceof Error ? error.message : "스크랩 해제에 실패했습니다."
        );
      } finally {
        setPendingQuoteId(null);
      }
    },
    [pendingQuoteId]
  );

  const handleRetry = () => {
    setLoading(true);
    setLoadError(false);
    setRetryCount((count) => count + 1);
  };

  if (loading) return <SkeletonQuoteCard compact />;

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h3 className="font-semibold">
              스크랩한 명언을 불러오지 못했습니다.
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              잠시 후 다시 시도해주세요.
            </p>
          </div>
          <Button variant="outline" onClick={handleRetry}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div>
            <h3 className="font-semibold">스크랩한 명언이 없습니다.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              오늘의 명언에서 마음에 드는 문장을 저장해보세요.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTE_PATH.HOME}>오늘의 명언 보기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((scrapedQuote) => (
        <div
          key={scrapedQuote.id}
          className={
            pendingQuoteId === scrapedQuote.quote.id
              ? "pointer-events-none opacity-60"
              : undefined
          }
        >
          <QuoteCard
            quote={scrapedQuote.quote}
            isScraped
            isCopied={copiedQuoteId === scrapedQuote.id}
            compact
            handleScrap={() => handleUnscrap(scrapedQuote)}
            handleCopyToClipboard={() => handleCopyToClipboard(scrapedQuote)}
          />
        </div>
      ))}
    </div>
  );
}
