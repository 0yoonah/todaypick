"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { dailyActivityQueryKey } from "@/utils/dailyActivityUtils";
import type { DailyActivity } from "@/types/dailyActivity";

async function fetchDailyActivity(date: string): Promise<DailyActivity | null> {
  const response = await fetch(`/api/daily-activities?date=${date}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "오늘의 학습 현황을 불러오지 못했습니다.");
  }

  return response.json();
}

export function useDailyActivities() {
  const { user, loading: isAuthLoading } = useAuthStore();
  const [date, setDate] = useState(() => getSeoulDateKey());

  useEffect(() => {
    const updateDate = () => setDate(getSeoulDateKey());
    const intervalId = window.setInterval(updateDate, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const query = useQuery({
    queryKey: dailyActivityQueryKey(user?.id ?? "guest", date),
    queryFn: () => fetchDailyActivity(date),
    enabled: Boolean(user) && !isAuthLoading,
    retry: 1,
  });

  return {
    ...query,
    date,
    user,
    isAuthLoading,
  };
}
