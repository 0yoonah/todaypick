import { ROUTE_PATH } from "@/config/constants";
import type { FeedCategory } from "@/types/feed";

/** 홈에서 미리 보여줄 콘텐츠 개수 */
export const HOME_PREVIEW_COUNT = 3;

/** 홈의 전체보기 링크는 현재 선택한 탭의 피드 목록으로 연결한다. */
export const getFeedOverviewHref = (
  tab: FeedCategory | "writing"
): string => `${ROUTE_PATH.FEEDS}?category=${tab}`;

/** 홈 미리보기에서는 최신 항목만 잘라 보여준다. */
export const getHomePreviewItems = <T>(
  items: T[],
  limit: number = HOME_PREVIEW_COUNT
): T[] => (limit > 0 ? items.slice(0, limit) : items);
