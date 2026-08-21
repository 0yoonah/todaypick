import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TodayQuiz from "./TodayQuiz";
import { quizzes } from "@/data/quizzes";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const quiz = quizzes[0];

/** 선택지 버튼은 "A. 내용" 형태의 이름을 가진다. 문구끼리 부분 일치할 수 있어 접두사로 찾는다. */
function optionButton(index: number) {
  return screen.getByRole("button", {
    name: new RegExp(`^${String.fromCharCode(65 + index)}\\.`),
  });
}

type TodayResponse = {
  quiz: typeof quiz | null;
  result: { selected_answer: number; is_correct: boolean } | null;
  isCompleted: boolean;
  solvedCount: number;
  totalCount: number;
};

const todayResponse = (overrides: Partial<TodayResponse> = {}): TodayResponse => ({
  quiz,
  result: null,
  isCompleted: false,
  solvedCount: 0,
  totalCount: quizzes.length,
  ...overrides,
});

/** GET은 오늘의 퀴즈, POST는 채점 결과를 준다. */
function stubFetch(options: {
  today?: TodayResponse;
  todayOk?: boolean;
  submit?: unknown;
  submitOk?: boolean;
}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      return {
        ok: options.submitOk ?? true,
        json: async () => options.submit ?? { isCorrect: true },
      };
    }
    return {
      ok: options.todayOk ?? true,
      json: async () => options.today ?? todayResponse(),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  push.mockReset();
  signInTestUser();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

describe("TodayQuiz", () => {
  it("문제와 선택지를 그린다", async () => {
    stubFetch({});

    renderWithQuery(<TodayQuiz />);

    expect(
      await screen.findByRole("heading", { name: quiz.question })
    ).toBeInTheDocument();
    quiz.options.forEach((_, index) => {
      expect(optionButton(index)).toBeInTheDocument();
    });
    // 선택 전에는 제출 버튼이 없다.
    expect(
      screen.queryByRole("button", { name: "답안 제출" })
    ).not.toBeInTheDocument();
  });

  it("푼 문제 수를 함께 안내한다", async () => {
    stubFetch({ today: todayResponse({ solvedCount: 3 }) });

    renderWithQuery(<TodayQuiz />);

    expect(
      await screen.findByText(
        `지금까지 ${quizzes.length}문제 중 3문제를 풀었어요.`
      )
    ).toBeInTheDocument();
  });

  it("선택지를 고르면 제출 버튼이 나타난다", async () => {
    const user = userEvent.setup();
    stubFetch({});

    renderWithQuery(<TodayQuiz />);
    await screen.findByRole("heading", { name: quiz.question });

    await user.click(optionButton(0));

    expect(
      screen.getByRole("button", { name: "답안 제출" })
    ).toBeInTheDocument();
  });

  it("비로그인 상태로 제출하면 로그인 화면으로 보낸다", async () => {
    signOutTestUser();
    const user = userEvent.setup();
    const fetchMock = stubFetch({});

    renderWithQuery(<TodayQuiz />);
    await screen.findByRole("heading", { name: quiz.question });

    await user.click(optionButton(0));
    await user.click(screen.getByRole("button", { name: "답안 제출" }));

    expect(push).toHaveBeenCalledWith("/login");
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST"
    );
    expect(posts).toHaveLength(0);
  });

  it("정답을 제출하면 결과와 해설을 보여주고 선택지를 잠근다", async () => {
    const user = userEvent.setup();
    stubFetch({ submit: { isCorrect: true } });

    renderWithQuery(<TodayQuiz />);
    await screen.findByRole("heading", { name: quiz.question });

    await user.click(optionButton(0));
    await user.click(screen.getByRole("button", { name: "답안 제출" }));

    expect(await screen.findByText("🎉 정답입니다!")).toBeInTheDocument();
    expect(screen.getByText(quiz.explanation)).toBeInTheDocument();
    expect(optionButton(0)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "답안 제출" })
    ).not.toBeInTheDocument();
  });

  it("오답을 제출하면 오답 문구를 보여준다", async () => {
    const user = userEvent.setup();
    stubFetch({ submit: { isCorrect: false } });

    renderWithQuery(<TodayQuiz />);
    await screen.findByRole("heading", { name: quiz.question });

    await user.click(optionButton(0));
    await user.click(screen.getByRole("button", { name: "답안 제출" }));

    expect(await screen.findByText("❌ 정답이 아닙니다")).toBeInTheDocument();
  });

  it("이미 푼 문제는 결과가 보이는 상태로 시작한다", async () => {
    stubFetch({
      today: todayResponse({
        result: { selected_answer: 1, is_correct: true },
        solvedCount: 1,
      }),
    });

    renderWithQuery(<TodayQuiz />);

    expect(await screen.findByText("🎉 정답입니다!")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "답안 제출" })
    ).not.toBeInTheDocument();
  });

  it("모두 풀면 완주 상태와 기록 링크를 보여준다", async () => {
    stubFetch({
      today: todayResponse({
        quiz: null,
        isCompleted: true,
        solvedCount: quizzes.length,
      }),
    });

    renderWithQuery(<TodayQuiz />);

    expect(
      await screen.findByRole("heading", { name: "준비된 퀴즈를 모두 풀었어요." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "퀴즈 기록 보기" })
    ).toHaveAttribute("href", "/profile?tab=quiz_records");
  });

  it("조회에 실패하면 안내 문구를 보여준다", async () => {
    stubFetch({ todayOk: false });

    renderWithQuery(<TodayQuiz />);

    expect(
      await screen.findByRole("heading", { name: "퀴즈를 불러오지 못했습니다." })
    ).toBeInTheDocument();
  });

  it("제출에 실패하면 서버 문구를 알린다", async () => {
    const user = userEvent.setup();
    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);
    stubFetch({
      submitOk: false,
      submit: { error: "이미 답안을 제출한 퀴즈입니다." },
    });

    renderWithQuery(<TodayQuiz />);
    await screen.findByRole("heading", { name: quiz.question });

    await user.click(optionButton(0));
    await user.click(screen.getByRole("button", { name: "답안 제출" }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("이미 답안을 제출한 퀴즈입니다.");
    });
    // 실패했으므로 결과를 보여주지 않는다.
    expect(screen.queryByText("🎉 정답입니다!")).not.toBeInTheDocument();
  });
});
