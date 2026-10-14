import "server-only";

import { FEED_PERSONALIZE_WINDOW_DAYS } from "@/config/constants";
import type { InterestId } from "@/config/interests";
import { getFeedSources } from "@/data/feeds";
import type { CursorFeedPage, Feed, RSSFeedCategory } from "@/types/feed";
import type { createClient } from "@/utils/supabase/server";
import {
  comparePersonalKey,
  decodeFeedCursor,
  encodeFeedCursor,
  type FeedSortKey,
  type PersonalCursor,
  type PersonalSortKey,
} from "@/utils/feedCursorUtils";

export type FeedItemsClient = Awaited<ReturnType<typeof createClient>>;

export type FeedItemsPageOptions = {
  category: RSSFeedCategory;
  limit: number;
  cursor?: string;
  /** 로그인한 회원의 관심 분야. 비어 있으면 최신순이다. */
  interests: InterestId[];
  /** 관심 분야 칩. 고르면 맞춤 정렬 없이 그 분야 글만 최신순으로 보여 준다. */
  filterInterest?: InterestId;
  /** 제목 검색어. 있으면 맞춤 정렬 없이 최신순이다. 길이 검증은 route가 한다. */
  query?: string;
  now: Date;
};

type FeedItemRecord = {
  id: string;
  source_id: string;
  category: RSSFeedCategory;
  title: string;
  description: string;
  image_url: string | null;
  author: string | null;
  interests: InterestId[] | null;
  published_at: string;
};

type WindowRecord = Pick<FeedItemRecord, "id" | "published_at" | "interests">;

const TABLE = "feed_items";
const FEED_COLUMNS =
  "id, source_id, category, title, description, image_url, author, interests, published_at";
const WINDOW_COLUMNS = "id, published_at, interests";
// 맞춤 기간 안의 글은 많아야 수백 개다. 상한은 PostgREST 기본 최대 행 수에 맞춘다.
const MAX_WINDOW_ROWS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOAD_FAILED_MESSAGE = "피드를 불러오지 못했습니다.";

type Context = {
  client: FeedItemsClient;
  category: RSSFeedCategory;
  sourceIds: string[];
  sourceNames: Map<string, string>;
};

function toIso(value: string): string {
  return new Date(value).toISOString();
}

// PostgREST or 필터 안의 값은 큰따옴표로 감싸고, 안쪽의 역슬래시와 큰따옴표는 역슬래시로 이스케이프한다.
function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// LIKE 패턴의 와일드카드(%, _)와 이스케이프 문자(\)를 글자 그대로 찾게 한다.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** 최신순(published_at desc, id asc)에서 key 다음 글을 고르는 조건 */
function afterKeyFilter({ t, id }: FeedSortKey): string {
  return `published_at.lt.${quote(t)},and(published_at.eq.${quote(t)},id.gt.${quote(id)})`;
}

function baseQuery(context: Context, columns: string) {
  return context.client
    .from(TABLE)
    .select(columns)
    .eq("category", context.category)
    .in("source_id", context.sourceIds);
}

function failed(error: { code?: string; message?: string }): never {
  console.error(`피드 조회 실패 (${error.code}): ${error.message}`);
  throw new Error(LOAD_FAILED_MESSAGE);
}

function toFeed(record: FeedItemRecord, sourceNames: Map<string, string>): Feed {
  return {
    id: record.id,
    url: record.id,
    title: record.title,
    description: record.description,
    source: sourceNames.get(record.source_id) ?? record.source_id,
    published_at: toIso(record.published_at),
    category: record.category,
    image_url: record.image_url ?? undefined,
    author: record.author ?? undefined,
    interests: record.interests ?? [],
  };
}

async function readNewest(
  context: Context,
  options: {
    count: number;
    after?: FeedSortKey;
    before?: string;
    /** 맞춤 모드에서 첫 요청 뒤에 수집된 글을 빼는 기준 */
    collectedUntil?: string;
    filterInterest?: InterestId;
    query?: string;
  }
): Promise<{ records: FeedItemRecord[]; hasMore: boolean }> {
  let query = baseQuery(context, FEED_COLUMNS);
  if (options.collectedUntil) {
    query = query.lte("collected_at", options.collectedUntil);
  }
  if (options.before) query = query.lt("published_at", options.before);
  if (options.filterInterest) {
    query = query.contains("interests", [options.filterInterest]);
  }
  if (options.query) {
    query = query.ilike("title", `%${escapeLikePattern(options.query)}%`);
  }
  if (options.after) query = query.or(afterKeyFilter(options.after));

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(options.count + 1);

  if (error) failed(error);

  const records = (data ?? []) as unknown as FeedItemRecord[];
  return {
    records: records.slice(0, options.count),
    hasMore: records.length > options.count,
  };
}

async function getNewestPage(
  context: Context,
  options: FeedItemsPageOptions,
  after?: FeedSortKey
): Promise<CursorFeedPage> {
  const { records, hasMore } = await readNewest(context, {
    count: options.limit,
    after,
    filterInterest: options.filterInterest,
    query: options.query,
  });
  const last = records.at(-1);

  return {
    feeds: records.map((record) => toFeed(record, context.sourceNames)),
    nextCursor:
      hasMore && last
        ? encodeFeedCursor({ v: 1, m: "d", t: toIso(last.published_at), id: last.id })
        : null,
  };
}

function countMatches(interests: InterestId[] | null, selected: Set<InterestId>): number {
  return (interests ?? []).filter((interest) => selected.has(interest)).length;
}

/**
 * 회원 맞춤 정렬.
 * ① 기간 안(s ≤ 발행 ≤ u): 관심 분야 일치 수 → 최신 → id. 서버에서 정렬한다.
 * ② 기간 밖(발행 < s): 최신순. DB 커서로 이어서 읽는다.
 * ①이 페이지 중간에 끝나면 같은 응답 안에서 ②로 채운다.
 */
async function getPersonalPage(
  context: Context,
  options: FeedItemsPageOptions,
  cursor?: PersonalCursor
): Promise<CursorFeedPage> {
  const windowDays = FEED_PERSONALIZE_WINDOW_DAYS[context.category];
  const until = cursor?.u ?? options.now.toISOString();
  const since =
    cursor?.s ?? new Date(options.now.getTime() - windowDays * DAY_MS).toISOString();
  const base = { v: 1 as const, m: "p" as const, s: since, u: until };

  const feeds: Feed[] = [];

  if (!cursor || cursor.ph === 1) {
    // 첫 요청 뒤에 수집된 글은 빼서 페이지마다 같은 집합을 읽는다.
    // collected_at은 upsert가 바꾸지 않아 스크롤 동안 고정된다.
    const { data, error } = await baseQuery(context, WINDOW_COLUMNS)
      .lte("collected_at", until)
      .gte("published_at", since)
      .lte("published_at", until)
      .order("published_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(MAX_WINDOW_ROWS);
    if (error) failed(error);
    if (data && data.length >= MAX_WINDOW_ROWS) {
      console.warn(
        `맞춤 기간 글이 ${MAX_WINDOW_ROWS}개 상한에 닿았습니다 (${context.category}). 오래된 기간 글 일부가 빠집니다.`
      );
    }

    const selected = new Set(options.interests);
    const keys: PersonalSortKey[] = ((data ?? []) as unknown as WindowRecord[])
      .map((record) => ({
        sc: countMatches(record.interests, selected),
        t: toIso(record.published_at),
        id: record.id,
      }))
      .sort(comparePersonalKey);

    const lastKey = cursor?.k;
    const remaining =
      lastKey && lastKey.sc !== undefined
        ? keys.filter(
            (key) => comparePersonalKey(key, { ...lastKey, sc: lastKey.sc! }) > 0
          )
        : keys;
    const pageKeys = remaining.slice(0, options.limit);

    if (pageKeys.length > 0) {
      const { data: rows, error: rowsError } = await baseQuery(context, FEED_COLUMNS).in(
        "id",
        pageKeys.map(({ id }) => id)
      );
      if (rowsError) failed(rowsError);

      const byId = new Map(
        ((rows ?? []) as unknown as FeedItemRecord[]).map((record) => [record.id, record])
      );
      for (const { id } of pageKeys) {
        const record = byId.get(id);
        if (record) feeds.push(toFeed(record, context.sourceNames));
      }
    }

    if (remaining.length > options.limit) {
      const last = pageKeys[pageKeys.length - 1];
      return { feeds, nextCursor: encodeFeedCursor({ ...base, ph: 1, k: last }) };
    }
  }

  // ② 기간 밖. ①에서 이어졌다면 처음부터, 2단계 커서라면 마지막 글 다음부터 읽는다.
  const count = options.limit - feeds.length;
  const after = cursor?.ph === 2 ? cursor.k : undefined;
  const { records, hasMore } = await readNewest(context, {
    count,
    before: since,
    collectedUntil: until,
    after: after ? { t: after.t, id: after.id } : undefined,
  });
  feeds.push(...records.map((record) => toFeed(record, context.sourceNames)));

  if (!hasMore) return { feeds, nextCursor: null };

  const last = records.at(-1);
  return {
    feeds,
    nextCursor: encodeFeedCursor(
      last
        ? { ...base, ph: 2, k: { t: toIso(last.published_at), id: last.id } }
        : { ...base, ph: 2, ...(after ? { k: after } : {}) }
    ),
  };
}

export async function getFeedItemsPage(
  client: FeedItemsClient,
  options: FeedItemsPageOptions
): Promise<CursorFeedPage> {
  const cursor = options.cursor ? decodeFeedCursor(options.cursor) : undefined;

  const sources = getFeedSources(options.category);
  if (sources.length === 0) return { feeds: [], nextCursor: null };

  const context: Context = {
    client,
    category: options.category,
    sourceIds: sources.map(({ id }) => id),
    sourceNames: new Map(sources.map(({ id, name }) => [id, name])),
  };

  // 커서가 있으면 커서의 모드를 따른다. 스크롤 중 관심 분야가 바뀌어도 이어 읽기가 깨지지 않는다.
  const personal = cursor
    ? cursor.m === "p"
    : options.interests.length > 0 && !options.filterInterest && !options.query;

  if (personal) {
    return getPersonalPage(context, options, cursor as PersonalCursor | undefined);
  }

  return getNewestPage(
    context,
    options,
    cursor?.m === "d" ? { t: cursor.t, id: cursor.id } : undefined
  );
}
