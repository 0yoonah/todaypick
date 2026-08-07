import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAILY_ACTIVITY_TYPES,
  isDailyActivityType,
  syncReadingGoalCompletion,
} from "@/services/dailyActivityService";
import { calculateLearningStreaks } from "@/utils/streakUtils";

interface ActivityRow {
  user_id: string;
  date: string;
  reading_goal: number | null;
  reading_goal_completed: boolean;
}

interface ReadRow {
  user_id: string;
  read_date: string;
}

interface StubData {
  users: { id: string; daily_read_goal: number | null }[];
  activities: ActivityRow[];
  reads: ReadRow[];
}

type Filter = (row: Record<string, unknown>) => boolean;

/** syncReadingGoalCompletion이 사용하는 범위만 흉내 내는 Supabase 스텁 */
function createSupabaseStub(data: StubData) {
  const tables: Record<string, Record<string, unknown>[]> = {
    users: data.users,
    daily_activities: data.activities as unknown as Record<string, unknown>[],
    feed_reads: data.reads as unknown as Record<string, unknown>[],
  };
  const updateCalls: { date: string; payload: Record<string, unknown> }[] = [];

  const createBuilder = (table: string) => {
    const filters: Filter[] = [];
    let pendingUpdate: Record<string, unknown> | null = null;

    const rows = () => tables[table].filter((row) => filters.every((f) => f(row)));

    const builder = {
      select: () => builder,
      update: (payload: Record<string, unknown>) => {
        pendingUpdate = payload;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return builder;
      },
      in: (column: string, values: unknown[]) => {
        filters.push((row) => values.includes(row[column]));
        return builder;
      },
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      then: (
        resolve: (result: { data: unknown; error: null }) => unknown
      ) => {
        const matched = rows();
        if (pendingUpdate) {
          matched.forEach((row) => {
            updateCalls.push({
              date: String(row.date),
              payload: pendingUpdate as Record<string, unknown>,
            });
            Object.assign(row, pendingUpdate);
          });
        }
        return Promise.resolve(resolve({ data: matched, error: null }));
      },
    };

    return builder;
  };

  return {
    client: { from: (table: string) => createBuilder(table) } as unknown as SupabaseClient,
    updateCalls,
    activities: data.activities,
  };
}

const USER_ID = "user-1";

describe("syncReadingGoalCompletion", () => {
  it("목표에 미달한 날짜의 완료 상태를 해제한다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 3 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: 3,
          reading_goal_completed: true,
        },
      ],
      reads: [{ user_id: USER_ID, read_date: "2026-08-03" }],
    });

    const updated = await syncReadingGoalCompletion(stub.client, USER_ID, [
      "2026-08-03",
    ]);

    expect(updated).toEqual(["2026-08-03"]);
    expect(stub.activities[0].reading_goal_completed).toBe(false);
  });

  it("목표를 여전히 채운 날짜는 완료 상태를 유지하고 갱신하지 않는다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 3 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: 2,
          reading_goal_completed: true,
        },
      ],
      reads: [
        { user_id: USER_ID, read_date: "2026-08-03" },
        { user_id: USER_ID, read_date: "2026-08-03" },
      ],
    });

    const updated = await syncReadingGoalCompletion(stub.client, USER_ID, [
      "2026-08-03",
    ]);

    expect(updated).toEqual([]);
    expect(stub.updateCalls).toHaveLength(0);
    expect(stub.activities[0].reading_goal_completed).toBe(true);
  });

  it("일일 목표가 없으면 사용자 기본 목표를 사용한다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 1 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: null,
          reading_goal_completed: false,
        },
      ],
      reads: [{ user_id: USER_ID, read_date: "2026-08-03" }],
    });

    const updated = await syncReadingGoalCompletion(stub.client, USER_ID, [
      "2026-08-03",
    ]);

    expect(updated).toEqual(["2026-08-03"]);
    expect(stub.activities[0].reading_goal_completed).toBe(true);
  });

  it("여러 날짜를 한 번에 재계산하고 다른 사용자 기록은 세지 않는다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 2 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-02",
          reading_goal: 2,
          reading_goal_completed: true,
        },
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: 2,
          reading_goal_completed: true,
        },
      ],
      reads: [
        { user_id: USER_ID, read_date: "2026-08-02" },
        { user_id: USER_ID, read_date: "2026-08-02" },
        { user_id: "other-user", read_date: "2026-08-03" },
        { user_id: "other-user", read_date: "2026-08-03" },
      ],
    });

    const updated = await syncReadingGoalCompletion(stub.client, USER_ID, [
      "2026-08-02",
      "2026-08-03",
      "2026-08-03",
    ]);

    expect(updated).toEqual(["2026-08-03"]);
    expect(stub.activities[0].reading_goal_completed).toBe(true);
    expect(stub.activities[1].reading_goal_completed).toBe(false);
  });

  it("재계산 결과가 연속 학습일에 반영된다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 2 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-01",
          reading_goal: 2,
          reading_goal_completed: true,
        },
        {
          user_id: USER_ID,
          date: "2026-08-02",
          reading_goal: 2,
          reading_goal_completed: true,
        },
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: 2,
          reading_goal_completed: true,
        },
      ],
      reads: [
        { user_id: USER_ID, read_date: "2026-08-01" },
        { user_id: USER_ID, read_date: "2026-08-01" },
        { user_id: USER_ID, read_date: "2026-08-03" },
        { user_id: USER_ID, read_date: "2026-08-03" },
      ],
    });

    expect(
      calculateLearningStreaks(stub.activities, "2026-08-03").currentStreak
    ).toBe(3);

    await syncReadingGoalCompletion(stub.client, USER_ID, ["2026-08-02"]);

    expect(
      calculateLearningStreaks(stub.activities, "2026-08-03")
    ).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it("유효하지 않은 날짜만 있으면 아무 작업도 하지 않는다", async () => {
    const stub = createSupabaseStub({
      users: [{ id: USER_ID, daily_read_goal: 2 }],
      activities: [
        {
          user_id: USER_ID,
          date: "2026-08-03",
          reading_goal: 2,
          reading_goal_completed: true,
        },
      ],
      reads: [],
    });

    expect(
      await syncReadingGoalCompletion(stub.client, USER_ID, ["2026-13-99", ""])
    ).toEqual([]);
    expect(stub.updateCalls).toHaveLength(0);
  });
});

describe("isDailyActivityType", () => {
  it("체크리스트 활동 값을 모두 허용한다", () => {
    expect(DAILY_ACTIVITY_TYPES).toContain("cs_completed");
    DAILY_ACTIVITY_TYPES.forEach((activity) => {
      expect(isDailyActivityType(activity)).toBe(true);
    });
  });

  it("정의되지 않은 값은 거부한다", () => {
    expect(isDailyActivityType("cs_reviewed")).toBe(false);
    expect(isDailyActivityType(null)).toBe(false);
  });
});
