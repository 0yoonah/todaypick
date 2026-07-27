"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ROUTE_PATH } from "@/config/constants";
import { getTodayQuote } from "@/utils/quoteUtils";
import QuoteCard from "@/components/quote/QuoteCard";
import SkeletonQuoteCard from "@/components/quote/SkeletonQuoteCard";

export default function TodayQuote() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isScraped, setIsScraped] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const todayQuote = getTodayQuote();

  useEffect(() => {
    let cancelled = false;

    const fetchQuote = async () => {
      try {
        if (!user) return;

        const response = await fetch(`/api/quotes?quoteId=${todayQuote.id}`);

        if (!response.ok && response.status !== 401) {
          throw new Error();
        }

        const scraped = await response.json();
        if (!cancelled) {
          setIsScraped(scraped);
        }
      } catch (err) {
        console.error("명언을 불러오는 중 오류가 발생했습니다.", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchQuote();

    return () => {
      cancelled = true;
    };
  }, [user, todayQuote]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!todayQuote) return;

    const text = `"${todayQuote.text}" - ${todayQuote.author}`;

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
  }, [todayQuote]);

  const handleScrap = useCallback(async () => {
    if (!user) {
      router.push(ROUTE_PATH.LOGIN);
      return;
    }

    if (!todayQuote) return;

    try {
      if (isScraped) {
        const response = await fetch(`/api/quotes?quoteId=${todayQuote.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("스크랩 해제에 실패했습니다.");
        }

        setIsScraped(false);
      } else {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quote: todayQuote }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "스크랩에 실패했습니다.");
        }

        setIsScraped(true);
      }
    } catch (error) {
      console.error("스크랩 처리 실패:", error);
      alert(error instanceof Error ? error.message : "처리에 실패했습니다.");
    }
  }, [user, todayQuote, isScraped, router]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">오늘의 명언</h2>
        <p className="text-muted-foreground text-sm">
          매일 자정에 새로운 명언이 업데이트됩니다.
        </p>
      </div>

      {isLoading ? (
        <SkeletonQuoteCard />
      ) : (
        <QuoteCard
          quote={todayQuote}
          isScraped={isScraped}
          isCopied={isCopied}
          handleScrap={handleScrap}
          handleCopyToClipboard={handleCopyToClipboard}
        />
      )}
    </div>
  );
}
