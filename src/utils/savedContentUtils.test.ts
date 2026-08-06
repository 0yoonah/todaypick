import { describe, expect, it } from "vitest";
import {
  resolveSavedContentState,
  type SavedContentSection,
} from "@/utils/savedContentUtils";

const section = (
  overrides: Partial<SavedContentSection> & Pick<SavedContentSection, "key">
): SavedContentSection => ({
  label: overrides.key === "feeds" ? "RSS 스크랩" : "게시글 북마크",
  active: true,
  isLoading: false,
  isError: false,
  count: 0,
  ...overrides,
});

describe("resolveSavedContentState", () => {
  it("활성 종류가 모두 로딩 중이면 초기 로딩 상태다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", isLoading: true }),
      section({ key: "writing", isLoading: true }),
    ]);

    expect(state.isInitialLoading).toBe(true);
    expect(state.isEmpty).toBe(false);
    expect(state.isAllFailed).toBe(false);
  });

  it("한 종류만 실패하면 나머지 데이터를 유지하고 실패 종류만 알린다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", isError: true }),
      section({ key: "writing", count: 2 }),
    ]);

    expect(state.isAllFailed).toBe(false);
    expect(state.isInitialLoading).toBe(false);
    expect(state.isEmpty).toBe(false);
    expect(state.failed.map((item) => item.key)).toEqual(["feeds"]);
    expect(state.totalCount).toBe(2);
  });

  it("두 종류가 모두 실패하면 전체 오류 상태다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", isError: true }),
      section({ key: "writing", isError: true }),
    ]);

    expect(state.isAllFailed).toBe(true);
    expect(state.isInitialLoading).toBe(false);
    expect(state.isEmpty).toBe(false);
    expect(state.failed).toHaveLength(2);
  });

  it("단일 필터에서 해당 종류가 실패하면 전체 오류로 본다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", active: false }),
      section({ key: "writing", isError: true }),
    ]);

    expect(state.isAllFailed).toBe(true);
    expect(state.failed.map((item) => item.key)).toEqual(["writing"]);
  });

  it("실패 없이 모두 비어 있으면 빈 상태로 구분한다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds" }),
      section({ key: "writing" }),
    ]);

    expect(state.isEmpty).toBe(true);
    expect(state.isAllFailed).toBe(false);
    expect(state.failed).toHaveLength(0);
  });

  it("아직 응답을 기다리는 종류가 있으면 빈 상태로 보지 않는다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", count: 3 }),
      section({ key: "writing", isLoading: true }),
    ]);

    expect(state.isEmpty).toBe(false);
    expect(state.isInitialLoading).toBe(false);
    expect(state.pending.map((item) => item.key)).toEqual(["writing"]);
  });

  it("비활성 종류는 상태 계산에서 제외한다", () => {
    const state = resolveSavedContentState([
      section({ key: "feeds", count: 4 }),
      section({ key: "writing", active: false, isError: true, isLoading: true }),
    ]);

    expect(state.failed).toHaveLength(0);
    expect(state.pending).toHaveLength(0);
    expect(state.totalCount).toBe(4);
  });
});
