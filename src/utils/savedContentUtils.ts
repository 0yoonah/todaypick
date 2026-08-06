export type SavedContentSectionKey = "feeds" | "writing";

export interface SavedContentSection {
  key: SavedContentSectionKey;
  label: string;
  /** 현재 필터에서 이 종류를 조회하는지 여부 */
  active: boolean;
  isLoading: boolean;
  isError: boolean;
  count: number;
}

export interface SavedContentState {
  /** 활성 종류가 모두 아직 로딩 중이라 보여줄 데이터가 없는 상태 */
  isInitialLoading: boolean;
  /** 아직 응답을 기다리는 종류 */
  pending: SavedContentSection[];
  /** 요청이 실패한 종류 */
  failed: SavedContentSection[];
  /** 활성 종류가 모두 실패한 상태 */
  isAllFailed: boolean;
  /** 실패 없이 모든 종류를 불러왔지만 저장한 콘텐츠가 없는 상태 */
  isEmpty: boolean;
  totalCount: number;
}

/**
 * 저장한 콘텐츠 목록의 종류별 상태를 조합한다.
 * 한 종류가 실패해도 정상 응답한 종류는 계속 표시할 수 있도록
 * 로딩·부분 실패·전체 실패·빈 상태를 서로 구분한다.
 */
export function resolveSavedContentState(
  sections: SavedContentSection[]
): SavedContentState {
  const active = sections.filter((section) => section.active);
  const failed = active.filter((section) => section.isError);
  const pending = active.filter(
    (section) => section.isLoading && !section.isError
  );
  const totalCount = active.reduce((sum, section) => sum + section.count, 0);

  const isAllFailed = active.length > 0 && failed.length === active.length;
  const isInitialLoading =
    active.length > 0 && !isAllFailed && pending.length === active.length;

  return {
    isInitialLoading,
    pending,
    failed,
    isAllFailed,
    isEmpty:
      active.length > 0 &&
      failed.length === 0 &&
      pending.length === 0 &&
      totalCount === 0,
    totalCount,
  };
}
