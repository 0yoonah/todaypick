import { vi } from "vitest";
import { createClient } from "@/utils/supabase/server";

/**
 * API route 테스트용 Supabase fake.
 *
 * 필터를 실제로 적용하지 않고, 테이블별로 주입한 응답을 그대로 돌려준다.
 * 어떤 조건으로 물어봤는지는 `calls()`의 호출 기록으로 검증한다.
 * 자세한 기준은 docs/testing-guide.md를 본다.
 */

type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type FakeResult = {
  data?: unknown;
  error?: PostgrestErrorLike | null;
  count?: number;
};

export type FakeResponse = {
  data: unknown;
  error: PostgrestErrorLike | null;
  count: number | null;
};

type Op = "select" | "insert" | "update" | "upsert" | "delete";
type CountOption = "exact" | "planned" | "estimated";
type Filter = [string, string, unknown];
type Modifier = [string, ...unknown[]];
type Terminal = "await" | "single" | "maybeSingle";

export type FakeCall = {
  op: Op;
  columns?: string;
  payload?: unknown;
  filters: Filter[];
  modifiers: Modifier[];
  terminal: Terminal;
};

export type StorageCall =
  | { bucket: string; op: "upload"; path: string }
  | { bucket: string; op: "remove"; paths: string[] };

export type FakeSupabaseOptions = {
  user?: { id: string } | null;
  from?: Record<string, FakeResult | FakeResult[]>;
  rpc?: Record<string, FakeResult | FakeResult[]>;
  storage?: { upload?: FakeResult | FakeResult[]; remove?: FakeResult | FakeResult[] };
};

type QueryBuilder = {
  select(columns?: string, options?: { count?: CountOption; head?: boolean }): QueryBuilder;
  insert(payload: unknown): QueryBuilder;
  update(payload: unknown): QueryBuilder;
  upsert(payload: unknown): QueryBuilder;
  delete(): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  in(column: string, values: unknown[]): QueryBuilder;
  gte(column: string, value: unknown): QueryBuilder;
  order(column: string, options?: unknown): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  single(): Promise<FakeResponse>;
  maybeSingle(): Promise<FakeResponse>;
  then<TResult1 = FakeResponse, TResult2 = never>(
    onFulfilled?: ((value: FakeResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
};

type FakeClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: null }> };
  from(table: string): QueryBuilder;
  rpc(name: string, args?: unknown): Promise<FakeResponse>;
  storage: {
    from(bucket: string): {
      upload(path: string, file: unknown): Promise<FakeResponse>;
      remove(paths: string[]): Promise<FakeResponse>;
    };
  };
};

export type FakeSupabase = {
  client: FakeClient;
  calls(table: string): FakeCall[];
  rpcCalls(name: string): unknown[];
  storageCalls(): StorageCall[];
};

type BuilderState = {
  table: string;
  op?: Op;
  columns?: string;
  payload?: unknown;
  count?: CountOption;
  head?: boolean;
  filters: Filter[];
  modifiers: Modifier[];
};

/** 배열로 주입한 응답을 호출 순서대로 꺼낸다. 단일 응답은 몇 번이든 그대로 준다. */
function createQueue(source: FakeResult | FakeResult[] | undefined, label: string) {
  let index = 0;
  return () => {
    if (source === undefined) {
      throw new Error(
        `fakeSupabase: ${label} 응답을 주입하지 않았다. 옵션에 추가한다.`
      );
    }
    if (!Array.isArray(source)) return source;
    if (index >= source.length) {
      throw new Error(
        `fakeSupabase: ${label} 응답을 다 소비했다. 배열에 응답을 더 넣거나 호출 횟수를 확인한다.`
      );
    }
    return source[index++];
  };
}

function toResponse(result: FakeResult, terminal: Terminal, head?: boolean): FakeResponse {
  if (result.error) return { data: null, error: result.error, count: null };
  if (head) return { data: null, error: null, count: result.count ?? null };

  const raw = result.data ?? null;
  const data =
    terminal === "await"
      ? raw
      : Array.isArray(raw)
        ? (raw[0] ?? null)
        : raw;

  return { data, error: null, count: result.count ?? null };
}

export function fakeSupabase(options: FakeSupabaseOptions): FakeSupabase {
  const calls = new Map<string, FakeCall[]>();
  const rpcArgs = new Map<string, unknown[]>();
  const storageCalls: StorageCall[] = [];

  const tableQueues = new Map<string, () => FakeResult>();
  const takeTable = (table: string) => {
    if (!tableQueues.has(table)) {
      tableQueues.set(
        table,
        createQueue(options.from?.[table], `"${table}" 테이블`)
      );
    }
    return tableQueues.get(table)!();
  };

  const rpcQueues = new Map<string, () => FakeResult>();
  const takeRpc = (name: string) => {
    if (!rpcQueues.has(name)) {
      rpcQueues.set(name, createQueue(options.rpc?.[name], `"${name}" rpc`));
    }
    return rpcQueues.get(name)!();
  };

  const takeUpload = createQueue(options.storage?.upload, `"storage.upload"`);
  const takeRemove = createQueue(options.storage?.remove, `"storage.remove"`);

  function settle(state: BuilderState, terminal: Terminal): Promise<FakeResponse> {
    return (async () => {
      const result = takeTable(state.table);
      const record: FakeCall = {
        op: state.op ?? "select",
        columns: state.columns,
        payload: state.payload,
        filters: state.filters,
        modifiers: state.modifiers,
        terminal,
      };
      const existing = calls.get(state.table) ?? [];
      calls.set(state.table, [...existing, record]);
      return toResponse(result, terminal, state.head);
    })();
  }

  // 필터와 수정자는 호출마다 새 빌더를 만든다.
  // route가 빌더를 변수에 담아 두 갈래로 나눠 await하는 패턴에서 조건이 섞이지 않게 한다.
  function createBuilder(state: BuilderState): QueryBuilder {
    const next = (patch: Partial<BuilderState>) => createBuilder({ ...state, ...patch });

    const builder: QueryBuilder = {
      select: (columns, opts) =>
        next({ op: "select", columns, count: opts?.count, head: opts?.head }),
      insert: (payload) => next({ op: "insert", payload }),
      update: (payload) => next({ op: "update", payload }),
      upsert: (payload) => next({ op: "upsert", payload }),
      delete: () => next({ op: "delete" }),
      eq: (column, value) => next({ filters: [...state.filters, ["eq", column, value]] }),
      in: (column, values) => next({ filters: [...state.filters, ["in", column, values]] }),
      gte: (column, value) => next({ filters: [...state.filters, ["gte", column, value]] }),
      order: (column, opts) =>
        next({ modifiers: [...state.modifiers, ["order", column, opts]] }),
      range: (from, to) => next({ modifiers: [...state.modifiers, ["range", from, to]] }),
      single: () => settle(state, "single"),
      maybeSingle: () => settle(state, "maybeSingle"),
      then: (onFulfilled, onRejected) => settle(state, "await").then(onFulfilled, onRejected),
    };

    // route가 아직 지원하지 않는 메서드를 쓰기 시작하면 조용히 넘기지 않고 여기서 알린다.
    return new Proxy(builder, {
      get(target, prop, receiver) {
        if (typeof prop === "symbol" || prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        throw new Error(
          `fakeSupabase: ".${prop}()"는 지원하지 않는 메서드다. src/test/fakeSupabase.ts에 먼저 추가한다.`
        );
      },
    });
  }

  const client: FakeClient = {
    auth: {
      getUser: async () => ({ data: { user: options.user ?? null }, error: null }),
    },
    from: (table) => createBuilder({ table, filters: [], modifiers: [] }),
    rpc: async (name, args) => {
      const result = takeRpc(name);
      rpcArgs.set(name, [...(rpcArgs.get(name) ?? []), args]);
      return toResponse(result, "await");
    },
    storage: {
      from: (bucket) => ({
        upload: async (path) => {
          const result = takeUpload();
          storageCalls.push({ bucket, op: "upload", path });
          return toResponse(result, "await");
        },
        remove: async (paths) => {
          const result = takeRemove();
          storageCalls.push({ bucket, op: "remove", paths });
          return toResponse(result, "await");
        },
      }),
    },
  };

  return {
    client,
    calls: (table) => calls.get(table) ?? [],
    rpcCalls: (name) => rpcArgs.get(name) ?? [],
    storageCalls: () => storageCalls,
  };
}

/**
 * `vi.mock("@/utils/supabase/server")`로 자동 모킹을 걸어둔 뒤 fake를 주입한다.
 * `vi.mock`은 호이스팅되므로 팩토리 안에서는 fake를 만들 수 없다.
 */
export function installSupabaseMock(client: FakeClient) {
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>
  );
}
