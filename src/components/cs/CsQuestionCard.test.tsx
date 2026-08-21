import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CsQuestionCard from "./CsQuestionCard";
import { csQuestions } from "@/data/csQuestions";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { CS_PASS_SCORE, gradeCsAnswer } from "@/utils/csUtils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const question = csQuestions[0];

beforeEach(() => {
  push.mockReset();
  signInTestUser();
});

afterEach(() => {
  signOutTestUser();
});

describe("CsQuestionCard", () => {
  it("분야 라벨과 질문을 그린다", () => {
    render(<CsQuestionCard question={question} />);

    expect(
      screen.getByRole("heading", { name: question.question })
    ).toBeInTheDocument();
  });

  it("답변이 비어 있으면 채점할 수 없다", () => {
    render(<CsQuestionCard question={question} />);

    expect(screen.getByRole("button", { name: "채점하기" })).toBeDisabled();
  });

  it("공백만 입력해도 채점할 수 없다", async () => {
    const user = userEvent.setup();
    render(<CsQuestionCard question={question} />);

    await user.type(screen.getByRole("textbox"), "   ");

    expect(screen.getByRole("button", { name: "채점하기" })).toBeDisabled();
  });

  it("힌트를 열면 키워드 목록이 보이고 다시 누르면 접힌다", async () => {
    const user = userEvent.setup();
    render(<CsQuestionCard question={question} />);

    await user.click(screen.getByRole("button", { name: /힌트 보기/ }));
    expect(screen.getByText("이 개념들을 언급해보세요")).toBeInTheDocument();
    for (const keyword of question.keywords) {
      expect(screen.getAllByText(keyword).length).toBeGreaterThan(0);
    }

    await user.click(screen.getByRole("button", { name: /힌트 접기/ }));
    expect(
      screen.queryByText("이 개념들을 언급해보세요")
    ).not.toBeInTheDocument();
  });

  it("모범 답안을 열고 접을 수 있다", async () => {
    const user = userEvent.setup();
    render(<CsQuestionCard question={question} />);

    await user.click(screen.getByRole("button", { name: /모범 답안 보기/ }));
    expect(screen.getByText(question.answer)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /모범 답안 접기/ }));
    expect(screen.queryByText(question.answer)).not.toBeInTheDocument();
  });

  it("비로그인 상태에서 채점하면 로그인 화면으로 보낸다", async () => {
    signOutTestUser();
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CsQuestionCard question={question} onSave={onSave} />);

    await user.type(screen.getByRole("textbox"), "답변");
    await user.click(screen.getByRole("button", { name: "채점하기" }));

    expect(push).toHaveBeenCalledWith("/login");
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("채점하면 점수와 언급 개수, 모범 답안을 함께 보여준다", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const answer = question.keywords.join(" ");
    const expected = gradeCsAnswer(answer, question.keywords);
    render(<CsQuestionCard question={question} onSave={onSave} />);

    await user.type(screen.getByRole("textbox"), answer);
    await user.click(screen.getByRole("button", { name: "채점하기" }));

    const result = screen.getByRole("status");
    expect(result).toHaveTextContent(`${expected.score}점`);
    expect(result).toHaveTextContent(
      `키워드 ${expected.total}개 중 ${expected.matched.length}개 언급`
    );
    // 채점과 함께 모범 답안이 열린다.
    expect(screen.getByText(question.answer)).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith({ answer });
    // 채점 후에는 답을 고칠 수 없다.
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("채점 중에는 버튼이 비활성화된다", () => {
    render(
      <CsQuestionCard question={question} isSaving onSave={vi.fn()} />
    );

    const button = screen.getByRole("button", { name: "채점 중..." });
    expect(button).toBeDisabled();
  });

  it("용어사전에 있는 키워드만 링크로 보여준다", async () => {
    const user = userEvent.setup();
    const [linked, ...rest] = question.keywords;
    render(
      <CsQuestionCard
        question={question}
        keywordLinks={{ [linked]: { id: "tcp", term: linked } }}
      />
    );

    await user.type(screen.getByRole("textbox"), question.keywords.join(" "));
    await user.click(screen.getByRole("button", { name: "채점하기" }));

    expect(
      screen.getByRole("link", { name: new RegExp(`${linked}.*용어사전`) })
    ).toHaveAttribute("href", "/glossary/tcp");
    for (const keyword of rest) {
      expect(
        screen.queryByRole("link", { name: new RegExp(keyword) })
      ).not.toBeInTheDocument();
    }
  });

  it("다시 풀기를 누르면 입력과 결과가 초기화된다", async () => {
    const user = userEvent.setup();
    render(<CsQuestionCard question={question} />);

    await user.type(screen.getByRole("textbox"), "답변");
    await user.click(screen.getByRole("button", { name: "채점하기" }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /다시 풀기/ }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.queryByText(question.answer)).not.toBeInTheDocument();
  });

  it("저장된 채점 기록이 있으면 결과를 복원해 보여준다", () => {
    render(
      <CsQuestionCard
        question={question}
        review={{
          question_id: question.id,
          score: 40,
          matched_keywords: [question.keywords[0]],
          answer: "지난 답변",
          reviewed_at: "2026-08-20T00:00:00.000Z",
        }}
      />
    );

    expect(screen.getByRole("textbox")).toHaveValue("지난 답변");
    expect(screen.getByRole("status")).toHaveTextContent("40점");
    // 결과가 있으면 다시 풀기가 보인다.
    expect(
      screen.getByRole("button", { name: /다시 풀기/ })
    ).toBeInTheDocument();
    expect(40).toBeLessThan(CS_PASS_SCORE);
  });

  it("저장 실패 문구를 결과 안에 보여준다", () => {
    render(
      <CsQuestionCard
        question={question}
        review={{
          question_id: question.id,
          score: 80,
          matched_keywords: question.keywords,
          answer: "답변",
          reviewed_at: "2026-08-20T00:00:00.000Z",
        }}
        saveError="채점 기록을 저장하지 못했습니다."
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "채점 기록을 저장하지 못했습니다."
    );
  });
});
