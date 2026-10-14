import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type FakeResult } from "@/test/fakeSupabase";
import {
  decodeFeedCursor,
  encodeFeedCursor,
  type PersonalCursor,
} from "@/utils/feedCursorUtils";
import type { FeedSource } from "@/types/feed";

const testState = vi.hoisted(() => ({ getFeedSources: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/data/feeds", () => ({ getFeedSources: testState.getFeedSources }));

import { getFeedItemsPage, type FeedItemsClient } from "./feedItemService";

const NOW = new Date("2026-10-14T00:00:00.000Z");
const SINCE_30D = "2026-09-14T00:00:00.000Z";

const SOURCES: FeedSource[] = [
  { id: "toss", name: "토스", rss_url: "https://toss.tech/rss.xml", category: "tech_blog" },
  { id: "kakao", name: "카카오", rss_url: "https://tech.kakao.com/feed", category: "tech_blog" },
];

type Row = {
  id: string;
  source_id: string;
  category: "tech_blog";
  title: string;
  description: string;
  image_url: string | null;
  author: string | null;
  interests: string[];
  published_at: string;
};

const row = (
  id: string,
  published_at: string,
  interests: string[] = [],
  source_id = "toss"
): Row => ({
  id: `https://example.com/${id}`,
  source_id,
  category: "tech_blog",
  title: `글 ${id}`,
  description: "설명",
  image_url: null,
  author: null,
  interests,
  published_at,
});

const lean = ({ id, published_at, interests }: Row) => ({ id, published_at, interests });

const setup = (feedItems: FakeResult | FakeResult[]) => {
  const fake = fakeSupabase({ from: { feed_items: feedItems } });
  return { fake, client: fake.client as unknown as FeedItemsClient };
};

beforeEach(() => {
  testState.getFeedSources.mockReset();
  testState.getFeedSources.mockReturnValue(SOURCES);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("최신순", () => {
  it("활성 출처의 글을 최신순으로 읽고, 남은 글이 있으면 마지막 글 커서를 준다", async () => {
    const rows = [
      row("c", "2026-10-13T00:00:00+00:00"),
      row("b", "2026-10-12T00:00:00+00:00", [], "kakao"),
      row("a", "2026-10-11T00:00:00+00:00"),
    ];
    const { fake, client } = setup({ data: rows });

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 2,
      interests: [],
      now: NOW,
    });

    expect(page.feeds.map(({ id, source }) => [id, source])).toEqual([
      ["https://example.com/c", "토스"],
      ["https://example.com/b", "카카오"],
    ]);
    expect(page.feeds[0]).toMatchObject({
      url: "https://example.com/c",
      published_at: "2026-10-13T00:00:00.000Z",
      image_url: undefined,
      author: undefined,
      category: "tech_blog",
    });
    expect(decodeFeedCursor(page.nextCursor!)).toEqual({
      v: 1,
      m: "d",
      t: "2026-10-12T00:00:00.000Z",
      id: "https://example.com/b",
    });

    const [call] = fake.calls("feed_items");
    expect(call.filters).toEqual([
      ["eq", "category", "tech_blog"],
      ["in", "source_id", ["toss", "kakao"]],
    ]);
    expect(call.modifiers).toEqual([
      ["order", "published_at", { ascending: false }],
      ["order", "id", { ascending: true }],
      ["limit", 3],
    ]);
  });

  it("남은 글이 없으면 다음 커서는 null", async () => {
    const { client } = setup({ data: [row("a", "2026-10-11T00:00:00+00:00")] });

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 2,
      interests: [],
      now: NOW,
    });

    expect(page.nextCursor).toBeNull();
  });

  it("커서가 있으면 마지막 글 다음부터 읽도록 or 조건을 건다", async () => {
    const { fake, client } = setup({ data: [] });
    const cursor = encodeFeedCursor({
      v: 1,
      m: "d",
      t: "2026-10-12T00:00:00.000Z",
      id: 'https://example.com/a?q="x",y',
    });

    await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      cursor,
      interests: [],
      now: NOW,
    });

    expect(fake.calls("feed_items")[0].filters).toContainEqual([
      "or",
      'published_at.lt."2026-10-12T00:00:00.000Z",and(published_at.eq."2026-10-12T00:00:00.000Z",id.gt."https://example.com/a?q=\\"x\\",y")',
      undefined,
    ]);
  });

  it("관심 분야 칩을 고르면 회원이어도 그 분야 글만 최신순으로 읽는다", async () => {
    const { fake, client } = setup({ data: [] });

    await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      interests: ["backend"],
      filterInterest: "frontend",
      now: NOW,
    });

    const calls = fake.calls("feed_items");
    expect(calls).toHaveLength(1);
    expect(calls[0].filters).toContainEqual(["contains", "interests", ["frontend"]]);
  });

  it("활성 출처가 없으면 조회하지 않고 빈 결과를 준다", async () => {
    testState.getFeedSources.mockReturnValue([]);
    const { fake, client } = setup({ data: [] });

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      interests: [],
      now: NOW,
    });

    expect(page).toEqual({ feeds: [], nextCursor: null });
    expect(fake.calls("feed_items")).toEqual([]);
  });

  it("조회에 실패하면 고정 문구로 예외를 던진다", async () => {
    const { client } = setup({ error: { code: "42P01", message: "relation does not exist" } });

    await expect(
      getFeedItemsPage(client, { category: "tech_blog", limit: 12, interests: [], now: NOW })
    ).rejects.toThrow("피드를 불러오지 못했습니다.");
  });
});

describe("제목 검색", () => {
  it("검색어가 있으면 회원이어도 제목에 검색어가 든 글만 최신순으로 읽는다", async () => {
    const { fake, client } = setup({ data: [] });

    await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      interests: ["backend"],
      query: "리액트",
      now: NOW,
    });

    const calls = fake.calls("feed_items");
    expect(calls).toHaveLength(1);
    expect(calls[0].filters).toContainEqual(["ilike", "title", "%리액트%"]);
  });

  it("검색어의 %, _, \\는 글자 그대로 찾도록 이스케이프한다", async () => {
    const { fake, client } = setup({ data: [] });

    await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      interests: [],
      query: "100%_a\\b",
      now: NOW,
    });

    expect(fake.calls("feed_items")[0].filters).toContainEqual([
      "ilike",
      "title",
      "%100\\%\\_a\\\\b%",
    ]);
  });

  it("검색과 관심 분야 칩을 함께 쓰면 두 조건을 모두 건다", async () => {
    const { fake, client } = setup({ data: [] });

    await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 12,
      interests: [],
      filterInterest: "frontend",
      query: "리액트",
      now: NOW,
    });

    const { filters } = fake.calls("feed_items")[0];
    expect(filters).toContainEqual(["contains", "interests", ["frontend"]]);
    expect(filters).toContainEqual(["ilike", "title", "%리액트%"]);
  });
});

describe("회원 맞춤", () => {
  const backend2 = row("w-backend2", "2026-10-01T00:00:00+00:00", ["backend", "infra_devops"]);
  const backend1 = row("w-backend1", "2026-10-13T00:00:00+00:00", ["backend"]);
  const none = row("w-none", "2026-10-13T12:00:00+00:00");
  const sameTimeA = row("w-same-a", "2026-10-10T00:00:00+00:00", ["backend"]);
  const sameTimeB = row("w-same-b", "2026-10-10T00:00:00+00:00", ["backend"]);
  const old1 = row("old1", "2026-09-01T00:00:00+00:00", ["backend"]);
  const old2 = row("old2", "2026-08-01T00:00:00+00:00");

  it("기간 안의 글을 관심 분야 일치 수 → 최신 → id 순으로 보여 주고 1단계 커서를 준다", async () => {
    const window = [none, sameTimeB, backend1, backend2, sameTimeA];
    const { fake, client } = setup([
      { data: window.map(lean) },
      { data: [sameTimeA, backend1, backend2] },
    ]);

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 3,
      interests: ["backend", "infra_devops"],
      now: NOW,
    });

    expect(page.feeds.map(({ id }) => id)).toEqual([
      backend2.id,
      backend1.id,
      sameTimeA.id,
    ]);
    expect(decodeFeedCursor(page.nextCursor!)).toEqual({
      v: 1,
      m: "p",
      s: SINCE_30D,
      u: NOW.toISOString(),
      ph: 1,
      k: { sc: 1, t: "2026-10-10T00:00:00.000Z", id: sameTimeA.id },
    });

    const [windowCall, rowsCall] = fake.calls("feed_items");
    expect(windowCall.columns).toBe("id, published_at, interests");
    // 첫 요청 뒤에 수집된 글은 발행 시각과 상관없이 이 스크롤에 넣지 않는다.
    expect(windowCall.filters).toEqual([
      ["eq", "category", "tech_blog"],
      ["in", "source_id", ["toss", "kakao"]],
      ["lte", "collected_at", NOW.toISOString()],
      ["gte", "published_at", SINCE_30D],
      ["lte", "published_at", NOW.toISOString()],
    ]);
    // 상한에 닿아도 매번 같은 부분 집합을 읽도록 정렬한다.
    expect(windowCall.modifiers).toEqual([
      ["order", "published_at", { ascending: false }],
      ["order", "id", { ascending: true }],
      ["limit", 1000],
    ]);
    expect(rowsCall.filters).toContainEqual([
      "in",
      "id",
      [backend2.id, backend1.id, sameTimeA.id],
    ]);
  });

  it("1단계가 페이지 중간에 끝나면 기간 밖 글을 최신순으로 이어 채우고 2단계 커서를 준다", async () => {
    const cursor: PersonalCursor = {
      v: 1,
      m: "p",
      s: SINCE_30D,
      u: NOW.toISOString(),
      ph: 1,
      k: { sc: 1, t: "2026-10-10T00:00:00.000Z", id: sameTimeA.id },
    };
    const window = [none, sameTimeB, backend1, backend2, sameTimeA];
    const { fake, client } = setup([
      { data: window.map(lean) },
      { data: [none, sameTimeB] },
      { data: [old1, old2] },
    ]);

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 3,
      cursor: encodeFeedCursor(cursor),
      interests: ["backend", "infra_devops"],
      now: new Date("2026-10-20T00:00:00.000Z"),
    });

    // 1단계 남은 글: sameTimeB(점수 1) → none(점수 0). 이어서 2단계 old1.
    expect(page.feeds.map(({ id }) => id)).toEqual([sameTimeB.id, none.id, old1.id]);
    expect(decodeFeedCursor(page.nextCursor!)).toEqual({
      v: 1,
      m: "p",
      s: SINCE_30D,
      u: NOW.toISOString(),
      ph: 2,
      k: { t: "2026-09-01T00:00:00.000Z", id: old1.id },
    });

    const calls = fake.calls("feed_items");
    // now가 달라도 커서의 기간을 쓴다.
    expect(calls[0].filters).toContainEqual(["gte", "published_at", SINCE_30D]);
    expect(calls[2].filters).toContainEqual(["lt", "published_at", SINCE_30D]);
    expect(calls[2].filters).toContainEqual(["lte", "collected_at", NOW.toISOString()]);
    expect(calls[2].modifiers).toContainEqual(["limit", 2]);
  });

  it("1단계가 페이지 끝에서 정확히 끝나면 2단계가 남았는지만 확인한다", async () => {
    const { fake, client } = setup([
      { data: [backend1].map(lean) },
      { data: [backend1] },
      { data: [old1] },
    ]);

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 1,
      interests: ["backend"],
      now: NOW,
    });

    expect(page.feeds.map(({ id }) => id)).toEqual([backend1.id]);
    expect(decodeFeedCursor(page.nextCursor!)).toEqual({
      v: 1,
      m: "p",
      s: SINCE_30D,
      u: NOW.toISOString(),
      ph: 2,
    });
    expect(fake.calls("feed_items")[2].modifiers).toContainEqual(["limit", 1]);
  });

  it("2단계 커서는 기간 안 글을 다시 읽지 않고 마지막 글 다음부터 읽는다", async () => {
    const cursor: PersonalCursor = {
      v: 1,
      m: "p",
      s: SINCE_30D,
      u: NOW.toISOString(),
      ph: 2,
      k: { t: "2026-09-01T00:00:00.000Z", id: old1.id },
    };
    const { fake, client } = setup({ data: [old2] });

    const page = await getFeedItemsPage(client, {
      category: "tech_blog",
      limit: 3,
      cursor: encodeFeedCursor(cursor),
      interests: ["backend"],
      now: NOW,
    });

    expect(page.feeds.map(({ id }) => id)).toEqual([old2.id]);
    expect(page.nextCursor).toBeNull();
    const calls = fake.calls("feed_items");
    expect(calls).toHaveLength(1);
    expect(calls[0].filters).toContainEqual([
      "or",
      `published_at.lt."2026-09-01T00:00:00.000Z",and(published_at.eq."2026-09-01T00:00:00.000Z",id.gt."${old1.id}")`,
      undefined,
    ]);
  });

  it("IT 뉴스는 기간을 3일로 잡는다", async () => {
    const { fake, client } = setup([{ data: [] }, { data: [] }]);

    await getFeedItemsPage(client, {
      category: "it_news",
      limit: 12,
      interests: ["backend"],
      now: NOW,
    });

    expect(fake.calls("feed_items")[0].filters).toContainEqual([
      "gte",
      "published_at",
      "2026-10-11T00:00:00.000Z",
    ]);
  });
});
