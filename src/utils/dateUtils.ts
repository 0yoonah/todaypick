export const SEOUL_TIME_ZONE = "Asia/Seoul";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getSeoulDateKey = (date: Date = new Date()): string => {
  const parts = dateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("서울 기준 날짜를 계산할 수 없습니다.");
  }

  return `${year}-${month}-${day}`;
};

export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

export const getCurrentWeekDateKeys = (date: Date = new Date()): string[] => {
  const todayKey = getSeoulDateKey(date);
  const [year, month, day] = todayKey.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayKey = addDaysToDateKey(todayKey, mondayOffset);

  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateKey(mondayKey, index)
  );
};

export const dateKeyToDate = (dateKey: string): Date =>
  new Date(`${dateKey}T12:00:00+09:00`);

export const isValidDateKey = (dateKey: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};
