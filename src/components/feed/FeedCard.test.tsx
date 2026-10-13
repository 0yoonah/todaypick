import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeedCard from "./FeedCard";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import type { Feed } from "@/types/feed";
import {
  DEFAULT_THUMBNAIL_IMAGE,
  LEGACY_DEFAULT_FEED_IMAGE_URL,
} from "@/config/feedImages";

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

describe("FeedCard 썸네일", () => {
  it("외부 썸네일을 이미지 최적화를 거치지 않고 원본 주소에서 불러온다", () => {
    const imageUrl = "https://cdn-images-1.medium.com/max/1024/thumb.png";
    renderWithQuery(
      <FeedCard feed={{ ...feed, image_url: imageUrl }} handleScrap={vi.fn()} />
    );

    const image = screen.getByRole("img", { name: feed.title });
    expect(image).toHaveAttribute("src", imageUrl);
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  // 기본 썸네일은 장식(alt="")이라 접근성 트리에서 빠지므로 DOM으로 찾는다.
  const thumbnail = (container: HTMLElement) => container.querySelector("img");

  it("이미지가 없으면 기본 썸네일을 장식으로 보여 준다", () => {
    const { container } = renderWithQuery(
      <FeedCard feed={feed} handleScrap={vi.fn()} />
    );

    expect(screen.queryByRole("img", { name: feed.title })).toBeNull();
    expect(thumbnail(container)?.getAttribute("src")).toContain(
      encodeURIComponent(DEFAULT_THUMBNAIL_IMAGE)
    );
    expect(thumbnail(container)).toHaveAttribute("alt", "");
  });

  it("예전 기본 이미지가 저장된 스냅숏도 기본 썸네일로 보여 준다", () => {
    const { container } = renderWithQuery(
      <FeedCard
        feed={{ ...feed, image_url: LEGACY_DEFAULT_FEED_IMAGE_URL }}
        handleScrap={vi.fn()}
      />
    );

    expect(thumbnail(container)?.getAttribute("src")).toContain(
      encodeURIComponent(DEFAULT_THUMBNAIL_IMAGE)
    );
  });

  it("이미지를 불러오지 못하면 기본 썸네일로 바꾼다", () => {
    const { container } = renderWithQuery(
      <FeedCard
        feed={{ ...feed, image_url: "https://static.toss.im/broken.png" }}
        handleScrap={vi.fn()}
      />
    );

    fireEvent.error(screen.getByRole("img", { name: feed.title }));

    expect(screen.queryByRole("img", { name: feed.title })).toBeNull();
    expect(thumbnail(container)?.getAttribute("src")).toContain(
      encodeURIComponent(DEFAULT_THUMBNAIL_IMAGE)
    );
    expect(thumbnail(container)).not.toHaveAttribute("referrerpolicy");
  });
});
