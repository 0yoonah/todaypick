import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WriteEditor from "./WriteEditor";
import { renderWithQuery } from "@/test/renderWithQuery";
import type { WritingDraft } from "@/types/writing";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const savedDraft: WritingDraft = {
  id: "d1",
  title: "저장된 제목",
  content: "저장된 본문",
  tags: ["frontend"],
  visibility: "private",
  thumbnail_url: null,
  sources: [],
  created_at: "2026-08-20T00:00:00.000Z",
  updated_at: "2026-08-20T00:00:00.000Z",
};

function stubFetch(response: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** 저장 요청의 method와 FormData를 꺼낸다. */
function lastRequest(fetchMock: ReturnType<typeof stubFetch>) {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { method: init.method, form: init.body as FormData };
}

const saveButton = () => screen.getByRole("button", { name: /저장/ });

beforeEach(() => {
  push.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WriteEditor 신규 작성", () => {
  it("입력이 없으면 저장할 수 없다", () => {
    renderWithQuery(<WriteEditor />);

    expect(saveButton()).toBeDisabled();
  });

  it("제목을 입력하면 저장할 수 있다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");

    expect(saveButton()).toBeEnabled();
  });

  // DEFAULT_WRITING_VISIBILITY가 "public"이라 새 글은 공개로 시작한다.
  it("기본 공개 여부는 공개다", () => {
    renderWithQuery(<WriteEditor />);

    expect(screen.getByRole("tab", { name: "공개" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("공개 게시")).toBeInTheDocument();
  });

  it("공개 여부를 바꾸면 배지와 저장 가능 상태가 함께 바뀐다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WriteEditor />);

    await user.click(screen.getByRole("tab", { name: "비공개" }));

    expect(screen.getByText("비공개 보관")).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  it("태그를 고르고 다시 누르면 해제된다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WriteEditor />);

    const tag = screen.getByRole("button", { name: "프론트엔드" });
    await user.click(tag);
    expect(saveButton()).toBeEnabled();

    await user.click(tag);
    expect(saveButton()).toBeDisabled();
  });

  it("새 글은 POST로 저장하고 id를 보내지 않는다", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(savedDraft);
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(saveButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const { method, form } = lastRequest(fetchMock);
    expect(method).toBe("POST");
    expect(form.get("id")).toBeNull();
    expect(form.get("title")).toBe("제목");
    expect(form.get("visibility")).toBe("public");
  });

  it("비공개로 저장하면 프로필의 내가 쓴 글로 한 번만 이동한다", async () => {
    const user = userEvent.setup();
    stubFetch(savedDraft);
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(screen.getByRole("tab", { name: "비공개" }));
    await user.click(saveButton());

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/profile?tab=writing");
  });

  it("공개로 저장하면 게시글 피드로 이동한다", async () => {
    const user = userEvent.setup();
    stubFetch({ ...savedDraft, visibility: "public" });
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(saveButton());

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/feeds?category=writing");
  });

  it("저장에 실패하면 서버 문구를 보여주고 이동하지 않는다", async () => {
    const user = userEvent.setup();
    stubFetch({ error: "글 초안을 만들지 못했습니다." }, false);
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "글 초안을 만들지 못했습니다."
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("서버가 문구를 주지 않으면 기본 문구를 보여준다", async () => {
    const user = userEvent.setup();
    stubFetch(null, false);
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "글 초안을 저장하지 못했습니다."
    );
  });

  it("실패한 뒤 다시 저장해 성공하면 문구가 사라지고 이동한다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "글 초안을 만들지 못했습니다." }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => savedDraft });
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<WriteEditor />);

    await user.type(screen.getByPlaceholderText("글 제목"), "제목");
    await user.click(saveButton());
    await screen.findByRole("alert");

    await user.click(saveButton());

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("WriteEditor 기존 글 수정", () => {
  it("저장된 값으로 시작하고 바꾸기 전에는 저장할 수 없다", () => {
    renderWithQuery(<WriteEditor initialDraft={savedDraft} />);

    expect(screen.getByPlaceholderText("글 제목")).toHaveValue("저장된 제목");
    expect(
      screen.getByPlaceholderText("생각을 Markdown으로 정리해 보세요.")
    ).toHaveValue("저장된 본문");
    expect(saveButton()).toBeDisabled();
  });

  it("저장된 태그와 공개 여부를 반영한다", () => {
    renderWithQuery(
      <WriteEditor initialDraft={{ ...savedDraft, visibility: "public" }} />
    );

    expect(screen.getByRole("tab", { name: "공개" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  // 인용 흐름은 초안을 비공개로 만든 뒤 이 화면으로 들어온다.
  // 저장된 값을 그대로 보여야 하고, 건드리지 않았으므로 변경도 아니다.
  it("비공개로 저장된 초안은 비공개로 열리고 변경으로 잡히지 않는다", () => {
    renderWithQuery(<WriteEditor initialDraft={savedDraft} />);

    expect(screen.getByRole("tab", { name: "비공개" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("비공개 보관")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("내용을 바꾸면 PUT으로 id와 함께 저장한다", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(savedDraft);
    renderWithQuery(<WriteEditor initialDraft={savedDraft} />);

    await user.type(screen.getByPlaceholderText("글 제목"), " 수정");
    await user.click(saveButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const { method, form } = lastRequest(fetchMock);
    expect(method).toBe("PUT");
    expect(form.get("id")).toBe("d1");
    expect(form.get("title")).toBe("저장된 제목 수정");
  });

  it("저장 중에는 버튼이 잠긴다", async () => {
    const user = userEvent.setup();
    let resolveSave: ((value: unknown) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveSave = resolve;
          })
      )
    );
    renderWithQuery(<WriteEditor initialDraft={savedDraft} />);

    await user.type(screen.getByPlaceholderText("글 제목"), " 수정");
    await user.click(saveButton());

    expect(
      await screen.findByRole("button", { name: "저장 중..." })
    ).toBeDisabled();

    resolveSave?.({ ok: true, json: async () => savedDraft });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});

describe("WriteEditor 인용 원문", () => {
  const withSource: WritingDraft = {
    ...savedDraft,
    sources: [
      {
        id: "s1",
        title: "원문 제목",
        source: "예시 소스",
        url: "https://example.com/a",
        category: "it_news",
        published_at: "2026-08-20T00:00:00.000Z",
      },
    ],
  };

  it("인용한 원문을 보여주고 원문 링크를 연다", () => {
    renderWithQuery(<WriteEditor initialDraft={withSource} />);

    expect(screen.getByText("원문 제목")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "원문 제목 원문 열기" })
    ).toHaveAttribute("href", "https://example.com/a");
  });

  it("인용을 해제하면 목록에서 사라지고 저장할 수 있다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WriteEditor initialDraft={withSource} />);

    await user.click(
      screen.getByRole("button", { name: "원문 제목 인용 해제" })
    );

    expect(screen.queryByText("원문 제목")).not.toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });
});

describe("WriteEditor 썸네일", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("이미지를 고르면 미리보기를 보여주고 저장할 수 있다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<WriteEditor initialDraft={savedDraft} />);

    expect(screen.getByText("미리보기 없음")).toBeInTheDocument();

    const file = new File([new Uint8Array(4)], "a.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("이미지 선택"), file);

    expect(screen.getByAltText("썸네일 미리보기")).toHaveAttribute(
      "src",
      "blob:preview"
    );
    expect(saveButton()).toBeEnabled();
  });
});
