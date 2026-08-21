"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ROUTE_PATH } from "@/config/constants";
import { getTodayQuote } from "@/utils/quoteUtils";
import QuoteCard from "@/components/quote/QuoteCard";
import SkeletonQuoteCard from "@/components/quote/SkeletonQuoteCard";
import { useQueryClient } from "@tanstack/react-query";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { markDailyActivityCompleted } from "@/utils/dailyActivityUtils";

export default function TodayQuote() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isScraped, setIsScraped] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const todayQuote = getTodayQuote();

  useEffect(() => {
    let cancelled = false;

    const fetchQuote = async () => {
      try {
        if (!user) return;

        const [response, activityResponse] = await Promise.all([
          fetch(`/api/quotes?quoteId=${todayQuote.id}`),
          fetch("/api/daily-activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activity: "quote_viewed" }),
          }),
        ]);

        if (!response.ok && response.status !== 401) {
          throw new Error();
        }
        if (!activityResponse.ok && activityResponse.status !== 401) {
          console.error("명언 조회 활동을 기록하지 못했습니다.");
        } else if (activityResponse.ok) {
          markDailyActivityCompleted(
            queryClient,
            user.id,
            getSeoulDateKey(),
            "quote_viewed"
          );
        }

        const scraped = await response.json();
        if (!cancelled) {
          setIsScraped(Boolean(scraped?.isScraped));
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
  }, [user, todayQuote, queryClient]);

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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-[-0.025em] text-foreground">
          오늘의 문장
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          잠시 멈춰 생각해볼 한 문장을 전해드려요.
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
