import { Quote } from "@/types/quote";
import { quotes } from "@/data/quotes";
import { getSeoulDateKey } from "@/utils/dateUtils";

export function getTodayQuote(): Quote {
  if (!quotes || quotes.length === 0) {
    throw new Error("명언 데이터가 없습니다.");
  }

  const dateString = getSeoulDateKey();
  const dateNumber = parseInt(dateString.replace(/-/g, ""));

  return quotes[dateNumber % quotes.length];
}
