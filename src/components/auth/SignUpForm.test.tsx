import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./SignUpForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/signup/action", () => ({ signup: vi.fn() }));

describe("SignUpForm 동의", () => {
  it("두 필수 항목을 모두 체크해야 가입 버튼이 활성화된다", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    const submit = screen.getByRole("button", { name: "회원가입" });

    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /만 14세 이상입니다/ }));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /이용약관과 개인정보처리방침에 동의합니다/ }));
    expect(submit).toBeEnabled();
  });

  it("약관과 방침 링크는 새 탭으로 열린다", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("link", { name: /이용약관/ })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /개인정보처리방침/ })).toHaveAttribute("href", "/privacy");
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
    }
  });
});
