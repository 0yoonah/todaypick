import "server-only";

import { parseInterestIds, type InterestId } from "@/config/interests";
import type { CursorFeedPage, RSSFeedCategory } from "@/types/feed";
import { createClient } from "@/utils/supabase/server";
import { getFeedItemsPage, type FeedItemsClient } from "@/services/feedItemService";

export type FeedPageRequest = {
  category: RSSFeedCategory;
  limit: number;
  cursor?: string;
  interest?: InterestId;
  query?: string;
};

async function getUserInterests(
  client: FeedItemsClient,
  userId: string
): Promise<InterestId[]> {
  const { data: profile } = await client
    .from("users")
    .select("interests")
    .eq("id", userId)
    .maybeSingle();
  return parseInterestIds(profile?.interests);
}

async function getScrapedFeedIds(
  client: FeedItemsClient,
  userId: string,
  feedIds: string[]
): Promise<Set<string>> {
  if (feedIds.length === 0) return new Set<string>();

  const { data, error } = await client
    .from("scraped_feeds")
    .select("feed->>id")
    .eq("user_id", userId)
    .in("feed->>id", [...new Set(feedIds)]);

  if (error) {
    console.error(`스크랩 상태 조회 실패 (${error.code}): ${error.message}`);
    throw new Error("스크랩 상태를 불러오지 못했습니다.");
  }

  return new Set(
    (data as { id?: unknown }[] | null)
      ?.map(({ id }) => id)
      .filter((id): id is string => typeof id === "string") ?? []
  );
}

/**
 * IT 뉴스·테크 블로그 한 페이지. 회원이면 관심 분야로 정렬하고 스크랩 상태를 붙인다.
 * `/api/feeds`와 서버에서 첫 페이지를 미리 그리는 페이지가 함께 쓴다.
 */
export async function loadFeedPage(
  client: FeedItemsClient,
  userId: string | null,
  request: FeedPageRequest
): Promise<CursorFeedPage> {
  const interests = userId ? await getUserInterests(client, userId) : [];

  const result = await getFeedItemsPage(client, {
    category: request.category,
    limit: request.limit,
    cursor: request.cursor,
    interests,
    filterInterest: request.interest,
    query: request.query,
    now: new Date(),
  });

  if (!userId) {
    return {
      ...result,
      feeds: result.feeds.map((feed) => ({ ...feed, is_scraped: false })),
    };
  }

  const scrapedFeedIds = await getScrapedFeedIds(
    client,
    userId,
    result.feeds.map(({ id }) => id)
  );

  return {
    ...result,
    feeds: result.feeds.map((feed) => ({
      ...feed,
      is_scraped: scrapedFeedIds.has(feed.id),
    })),
  };
}

/**
 * 서버 컴포넌트가 첫 페이지를 미리 그릴 때 쓴다.
 * 실패하면 null을 돌려주고, 화면은 지금처럼 브라우저에서 다시 조회한다.
 */
export async function loadInitialFeedPage(
  request: FeedPageRequest
): Promise<CursorFeedPage | null> {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return await loadFeedPage(client, user?.id ?? null, request);
  } catch (error) {
    console.error("피드 첫 페이지 서버 조회 실패:", error);
    return null;
  }
}
