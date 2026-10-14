import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TodayFeed from "./TodayFeed";
import { signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";

// 스크랩 서비스가 모듈을 불러올 때 브라우저 Supabase 클라이언트를 만든다. 이 테스트에서는 쓰지 않는다.
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const fetchMock = vi.fn(async () => ({
  ok: true,
  json: async () => ({ feeds: [], nextCursor: null }),
}));

beforeEach(() => {
  signOutTestUser();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const feedRequests = () =>
  fetchMock.mock.calls
    .map((args) => new URL(String((args as unknown[])[0]), "http://localhost"))
    .filter((url) => url.pathname === "/api/feeds");

describe("TodayFeed", () => {
  it("서버에서 받은 첫 카드를 다시 요청하지 않고 바로 보여 준다", async () => {
    renderWithQuery(
      <TodayFeed
        initialPage={{
          feeds: [
            {
              id: "https://news.example.com/1",
              url: "https://news.example.com/1",
              title: "서버에서 그린 뉴스",
              description: "",
              source: "GeekNews",
              published_at: "2026-10-14T00:00:00.000Z",
              category: "it_news",
              is_scraped: false,
            },
          ],
          nextCursor: null,
        }}
      />
    );

    expect(screen.getByText("서버에서 그린 뉴스")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(feedRequests()).toHaveLength(0);
  });

  it("서버에서 받은 첫 카드가 없으면 브라우저에서 조회한다", async () => {
    renderWithQuery(<TodayFeed />);

    await waitFor(() => expect(feedRequests()).toHaveLength(1));
    expect(feedRequests()[0].searchParams.get("limit")).toBe("3");
  });
});
