import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountDeletionSection from "./AccountDeletionSection";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import { useAuthStore } from "@/stores/authStore";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const openButton = () => screen.getByRole("button", { name: "회원 탈퇴" });
const submitButton = () => screen.getByRole("button", { name: "탈퇴하기" });
const passwordInput = () => screen.getByLabelText("비밀번호 확인");

beforeEach(() => {
  replace.mockReset();
  signInTestUser();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

describe("AccountDeletionSection", () => {
  it("버튼을 누르면 확인 폼이 열리고 취소하면 닫히며 입력이 지워진다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.queryByLabelText("비밀번호 확인")).toBeNull();
    await user.click(openButton());
    expect(passwordInput()).toHaveValue("");
  });

  it("비밀번호를 입력하기 전에는 탈퇴 버튼이 비활성이다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());

    expect(submitButton()).toBeDisabled();
  });

  it("실패하면 서버 문구를 알리고 입력을 유지한다", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "비밀번호가 일치하지 않습니다." }),
      })
    );
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "wrong");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("비밀번호가 일치하지 않습니다.");
    expect(passwordInput()).toHaveValue("wrong");
    expect(replace).not.toHaveBeenCalled();
  });

  it("성공하면 로그인 정보와 캐시를 비우고 홈으로 이동한다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { queryClient } = renderWithQuery(<AccountDeletionSection />);
    queryClient.setQueryData(["profile"], { nickname: "a" });

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(submitButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/account");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ password: "pw" });
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
  });

  it("요청 중에는 버튼을 다시 눌러도 한 번만 요청한다", async () => {
    const user = userEvent.setup();
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)));
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<AccountDeletionSection />);

    await user.click(openButton());
    await user.type(passwordInput(), "pw");
    await user.click(submitButton());
    const pending = screen.getByRole("button", { name: "탈퇴 처리 중..." });
    expect(pending).toBeDisabled();
    await user.click(pending);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ deleted: true }) });
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
