"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrapedQuote } from "@/types/quote";
import QuoteCard from "@/components/quote/QuoteCard";
import SkeletonQuoteCard from "@/components/quote/SkeletonQuoteCard";

export default function ScrapedQuotesTab() {
  const [quotes, setQuotes] = useState<ScrapedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

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
          alert("스크랩된 명언을 불러오는 중 오류가 발생했습니다.");
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
  }, []);

  const handleCopyToClipboard = useCallback(async (quote: ScrapedQuote) => {
    const text = `"${quote.quote.text}" - ${quote.quote.author}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      alert("클립보드 복사에 실패했습니다.");
    }
  }, []);

  const handleScrap = useCallback(async (quote: ScrapedQuote) => {
    try {
      if (quote.is_scraped) {
        const response = await fetch(`/api/quotes?quoteId=${quote.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("스크랩 해제에 실패했습니다.");
        }
      } else {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quote }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "스크랩에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("스크랩 처리 실패:", error);
      alert(error instanceof Error ? error.message : "처리에 실패했습니다.");
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {loading ? (
          <SkeletonQuoteCard />
        ) : (
          quotes.map((scrapedQuote) => (
            <QuoteCard
              key={scrapedQuote.id}
              quote={scrapedQuote.quote}
              isScraped={scrapedQuote?.is_scraped || true}
              isCopied={isCopied}
              handleScrap={() => handleScrap(scrapedQuote)}
              handleCopyToClipboard={() => handleCopyToClipboard(scrapedQuote)}
            />
          ))
        )}
      </div>
    </div>
  );
}
