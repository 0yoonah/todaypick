import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeedCard from "./FeedCard";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import type { Feed } from "@/types/feed";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const feed: Feed = {
  id: "f1",
  title: "원문 제목",
  description: "설명",
  url: "https://example.com/f1",
  source: "예시 소스",
  published_at: "2026-08-20T00:00:00.000Z",
  category: "it_news",
  interests: ["frontend"],
};

const savedDraft = {
  id: "d1",
  title: "",
  content: "",
  tags: [],
  visibility: "private",
  thumbnail_url: null,
  sources: [feed],
  created_at: "2026-08-21T00:00:00.000Z",
  updated_at: "2026-08-21T00:00:00.000Z",
};

const quoteButton = () =>
  screen.getByRole("button", { name: "이 글을 인용하여 글쓰기" });

beforeEach(() => {
  push.mockReset();
  signInTestUser();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

describe("FeedCard 인용하여 글쓰기", () => {
  it("비로그인이면 초안을 만들지 않고 로그인으로 보낸다", async () => {
    signOutTestUser();
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<FeedCard feed={feed} handleScrap={vi.fn()} />);
    await user.click(quoteButton());

    expect(push).toHaveBeenCalledWith("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("초안을 비공개로 만들고 원문을 인용해 넘긴다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => savedDraft,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQuery(<FeedCard feed={feed} handleScrap={vi.fn()} />);
    await user.click(quoteButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/writing-drafts");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    // 인용으로 만든 초안은 비공개로 시작한다. #161의 판단 근거다.
    expect(body.visibility).toBe("private");
    expect(body.sources).toEqual([
      {
        id: feed.id,
        title: feed.title,
        url: feed.url,
        source: feed.source,
        category: feed.category,
        published_at: feed.published_at,
        interests: feed.interests,
      },
    ]);
  });

  it("만든 초안의 글쓰기 화면으로 한 번만 이동한다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => savedDraft })
    );

    renderWithQuery(<FeedCard feed={feed} handleScrap={vi.fn()} />);
    await user.click(quoteButton());

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    // newDraft 파라미터는 붙지 않는다. 붙으면 저장된 비공개가 공개로 덮인다(#161).
    expect(push).toHaveBeenCalledWith("/write?draftId=d1");
  });

  it("초안 생성에 실패하면 이동하지 않는다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "글 초안을 만들지 못했습니다." }),
      })
    );

    renderWithQuery(<FeedCard feed={feed} handleScrap={vi.fn()} />);
    await user.click(quoteButton());

    await waitFor(() => expect(push).not.toHaveBeenCalled());
  });
});
