import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CategoryByFeed from "./CategoryByFeed";
import { FEED_SEARCH_DEBOUNCE_MS } from "./FeedSearchInput";
import { signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams("category=tech_blog"),
  push: vi.fn(),
}));

// 스크랩 서비스가 모듈을 불러올 때 브라우저 Supabase 클라이언트를 만든다. 이 테스트에서는 쓰지 않는다.
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({}) }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

const feedRequests = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([input]) => new URL(String(input), "http://localhost"))
    .filter((url) => url.pathname === "/api/feeds");

const searchBox = () => screen.getByRole("searchbox", { name: "피드 제목 검색" });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  signOutTestUser();
  navigation.params = new URLSearchParams("category=tech_blog");
  navigation.push.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ feeds: [], nextCursor: null }),
    }))
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CategoryByFeed 제목 검색", () => {
  it("검색어를 입력하면 q로 조회하고 결과가 없으면 검색어를 담은 빈 상태를 보여 준다", async () => {
    renderWithQuery(<CategoryByFeed />);
    await waitFor(() => expect(feedRequests()).toHaveLength(1));

    fireEvent.change(searchBox(), { target: { value: "리액트" } });
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));

    await waitFor(() =>
      expect(feedRequests().at(-1)?.searchParams.get("q")).toBe("리액트")
    );
    expect(await screen.findByText("'리액트'와 맞는 글이 없어요.")).toBeInTheDocument();
  });

  it("탭이 바뀌면 검색어를 비우고 원래 목록을 조회한다", async () => {
    const { rerender } = renderWithQuery(<CategoryByFeed />);
    fireEvent.change(searchBox(), { target: { value: "리액트" } });
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));
    await waitFor(() =>
      expect(feedRequests().at(-1)?.searchParams.get("q")).toBe("리액트")
    );

    navigation.params = new URLSearchParams("category=it_news");
    rerender(<CategoryByFeed />);

    await waitFor(() =>
      expect(feedRequests().at(-1)?.searchParams.get("category")).toBe("it_news")
    );
    expect(feedRequests().at(-1)?.searchParams.has("q")).toBe(false);
    expect(searchBox()).toHaveValue("");
  });

  it("게시글 탭에는 검색창을 두지 않는다", () => {
    navigation.params = new URLSearchParams("category=writing");

    renderWithQuery(<CategoryByFeed />);

    expect(screen.queryByRole("searchbox", { name: "피드 제목 검색" })).toBeNull();
  });
});

describe("CategoryByFeed 서버에서 받은 첫 페이지", () => {
  // jsdom에는 IntersectionObserver가 없다. 무한 스크롤 트리거를 직접 부르려고 콜백을 모은다.
  const observerCallbacks: IntersectionObserverCallback[] = [];
  beforeEach(() => {
    observerCallbacks.length = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      }
    );
  });

  const initialFeed = {
    id: "https://example.com/a",
    url: "https://example.com/a",
    title: "서버에서 그린 글",
    description: "설명",
    source: "토스",
    published_at: "2026-10-13T00:00:00.000Z",
    category: "tech_blog" as const,
    interests: [],
    is_scraped: false,
  };

  it("현재 탭의 첫 페이지를 받으면 다시 요청하지 않고 바로 보여 준다", async () => {
    renderWithQuery(
      <CategoryByFeed
        initialFeedPage={{
          category: "tech_blog",
          page: { feeds: [initialFeed], nextCursor: "next" },
        }}
      />
    );

    expect(screen.getByText("서버에서 그린 글")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(feedRequests()).toHaveLength(0);

    // 다음 페이지는 서버가 준 커서로 요청한다.
    act(() => {
      observerCallbacks.at(-1)?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    await waitFor(() => expect(feedRequests()).toHaveLength(1));
    expect(feedRequests()[0].searchParams.get("cursor")).toBe("next");
  });

  it("다른 관심 분야의 첫 페이지면 쓰지 않고 다시 요청한다", async () => {
    navigation.params = new URLSearchParams("category=tech_blog&interest=backend");

    renderWithQuery(
      <CategoryByFeed
        initialFeedPage={{
          category: "tech_blog",
          page: { feeds: [initialFeed], nextCursor: null },
        }}
      />
    );

    await waitFor(() => expect(feedRequests()).toHaveLength(1));
    expect(feedRequests()[0].searchParams.get("interest")).toBe("backend");
  });
});

