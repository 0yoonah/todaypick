import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DailyLearningChecklist from "./DailyLearningChecklist";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import { EMPTY_DAILY_ACTIVITY } from "@/utils/dailyActivityUtils";

function stubFetch(response: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  signInTestUser();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

describe("DailyLearningChecklist", () => {
  it("비로그인 상태에서는 안내만 보여준다", async () => {
    signOutTestUser();
    stubFetch({ ...EMPTY_DAILY_ACTIVITY });

    renderWithQuery(<DailyLearningChecklist />);

    expect(
      await screen.findByText("오늘 알아둘 내용을 준비했어요")
    ).toBeInTheDocument();
    expect(screen.queryByText("IT 피드 읽기")).not.toBeInTheDocument();
  });

  it("체크리스트 세 항목을 그리고 명언 항목은 넣지 않는다", async () => {
    stubFetch({ ...EMPTY_DAILY_ACTIVITY });

    renderWithQuery(<DailyLearningChecklist />);

    expect(await screen.findByText("IT 피드 읽기")).toBeInTheDocument();
    expect(screen.getByText("퀴즈 완료")).toBeInTheDocument();
    expect(screen.getByText("CS 지식")).toBeInTheDocument();
    // #127에서 명언 확인 항목을 제외했다.
    expect(screen.queryByText(/명언/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("완료한 항목 수에 따라 진행률을 계산한다", async () => {
    stubFetch({
      ...EMPTY_DAILY_ACTIVITY,
      feed_clicked: true,
      quiz_completed: false,
      cs_completed: false,
    });

    renderWithQuery(<DailyLearningChecklist />);

    const progressbar = await screen.findByRole("progressbar", {
      name: "오늘의 학습 진행률",
    });
    // 3개 중 1개 완료
    expect(progressbar).toHaveAttribute("aria-valuenow", "33");
  });

  it("세 항목을 모두 완료하면 완료 문구와 100%를 보여준다", async () => {
    stubFetch({
      ...EMPTY_DAILY_ACTIVITY,
      feed_clicked: true,
      quiz_completed: true,
      cs_completed: true,
    });

    renderWithQuery(<DailyLearningChecklist />);

    expect(
      await screen.findByRole("heading", {
        name: "오늘의 학습을 모두 완료했어요!",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "오늘의 학습 진행률" })
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("명언 확인만 했더라도 진행률에 넣지 않는다", async () => {
    stubFetch({ ...EMPTY_DAILY_ACTIVITY, quote_viewed: true });

    renderWithQuery(<DailyLearningChecklist />);

    const progressbar = await screen.findByRole("progressbar", {
      name: "오늘의 학습 진행률",
    });
    expect(progressbar).toHaveAttribute("aria-valuenow", "0");
  });

  it("읽기 진행 상황을 목표와 함께 보여준다", async () => {
    stubFetch({ ...EMPTY_DAILY_ACTIVITY, read_count: 2, reading_goal: 5 });

    renderWithQuery(<DailyLearningChecklist />);

    expect(
      await screen.findByLabelText("오늘 2개 읽음, 목표 5개")
    ).toHaveTextContent("2/5");
  });

  it("완료한 항목은 완료 문구로 바뀐다", async () => {
    stubFetch({ ...EMPTY_DAILY_ACTIVITY, cs_completed: true });

    renderWithQuery(<DailyLearningChecklist />);

    await screen.findByText("CS 지식");
    expect(screen.getAllByText("완료했어요")).toHaveLength(1);
  });

  it("조회에 실패하면 다시 불러오기를 제공한다", async () => {
    const fetchMock = stubFetch({ error: "일일 활동을 불러오는데 실패했습니다." }, false);

    renderWithQuery(<DailyLearningChecklist />);

    expect(
      await screen.findByText("학습 현황을 불러오지 못했어요", {}, { timeout: 3000 })
    ).toBeInTheDocument();

    const callsBeforeRetry = fetchMock.mock.calls.length;
    await userEvent.click(
      screen.getByRole("button", { name: "다시 불러오기" })
    );

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    });
  });
});
