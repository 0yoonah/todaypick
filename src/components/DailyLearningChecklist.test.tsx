import { screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import DailyLearningChecklist from "./DailyLearningChecklist";
import { signInTestUser, signOutTestUser } from "@/test/authState";
import { renderWithQuery } from "@/test/renderWithQuery";
import { EMPTY_DAILY_ACTIVITY } from "@/utils/dailyActivityUtils";

afterEach(() => {
  vi.unstubAllGlobals();
  signOutTestUser();
});

// 헬퍼가 동작하는지 확인하는 최소 예시다. 상태 전이는 #153에서 덮는다.
it("로그인 상태에서 체크리스트 항목을 그린다", async () => {
  signInTestUser();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...EMPTY_DAILY_ACTIVITY }),
    })
  );

  renderWithQuery(<DailyLearningChecklist />);

  expect(await screen.findByText("IT 피드 읽기")).toBeInTheDocument();
  expect(screen.getByText("퀴즈 완료")).toBeInTheDocument();
  expect(screen.getByText("CS 지식")).toBeInTheDocument();
});
