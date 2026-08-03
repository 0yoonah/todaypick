import { NextRequest, NextResponse } from "next/server";
import { FeedCategory, RSSFeedCategory } from "@/types/feed";
import { createClient } from "@/utils/supabase/server";
import { FEED_CATEGORY } from "@/config/constants";
import { getRSSFeedsWithPagination } from "@/services/rssFeedService";
import { isInterestId, parseInterestIds } from "@/config/interests";
import type { InterestId } from "@/config/interests";

const parseFeedParams = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const categoryValue = searchParams.get("category");
  const categories = Object.values(FEED_CATEGORY) as string[];

  if (!categoryValue || !categories.includes(categoryValue)) {
    throw new TypeError("유효한 피드 카테고리가 필요합니다.");
  }

  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "12");
  const interestValue = searchParams.get("interest");
  const interest = isInterestId(interestValue) ? interestValue : undefined;
  if (interestValue && !interest) {
    throw new TypeError("유효한 관심 분야가 필요합니다.");
  }
  const sourceCategoryValue = searchParams.get("sourceCategory");
  const sourceCategory =
    sourceCategoryValue === FEED_CATEGORY.IT_NEWS ||
    sourceCategoryValue === FEED_CATEGORY.TECH_BLOG
      ? (sourceCategoryValue as RSSFeedCategory)
      : undefined;
  if (sourceCategoryValue && !sourceCategory) {
    throw new TypeError("유효한 스크랩 피드 유형이 필요합니다.");
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("page는 1 이상의 정수여야 합니다.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new TypeError("limit은 1 이상 50 이하의 정수여야 합니다.");
  }

  const category = categoryValue as FeedCategory;
  return { category, page, limit, interest, sourceCategory };
};

const getScrapedFeeds = async (
  userId: string,
  page: number,
  limit: number,
  sourceCategory?: RSSFeedCategory
) => {
  const supabase = await createClient();
  let query = supabase
    .from("scraped_feeds")
    .select("*", { count: "exact" })
    .eq("user_id", userId);
  if (sourceCategory) {
    query = query.eq("feed->>category", sourceCategory);
  }
  const {
    data: scrapedFeeds,
    error,
    count,
  } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    throw new Error(`스크랩된 피드 조회 실패: ${error.message}`);
  }

  return {
    feeds:
      scrapedFeeds?.map(({ feed }) => ({ ...feed, is_scraped: true })) || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
};

const getScrapedFeedIds = async (userId: string, feedIds: string[]) => {
  if (feedIds.length === 0) return new Set<string>();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scraped_feeds")
    .select("feed->>id")
    .eq("user_id", userId)
    .in("feed->>id", [...new Set(feedIds)]);

  if (error) {
    throw new Error(`스크랩 상태 조회 실패: ${error.message}`);
  }

  return new Set(
    data
      ?.map(({ id }) => id)
      .filter((id): id is string => typeof id === "string") ?? []
  );
};

export async function GET(request: NextRequest) {
  try {
    const { category, page, limit, interest, sourceCategory } = parseFeedParams(request);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (category === FEED_CATEGORY.SCRAPED) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const result = await getScrapedFeeds(user.id, page, limit, sourceCategory);
      return NextResponse.json(result, { status: 200 });
    } else {
      let interests: InterestId[] = [];
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("interests")
          .eq("id", user.id)
          .maybeSingle();
        interests = parseInterestIds(profile?.interests);
      }

      const result = await getRSSFeedsWithPagination(
        category,
        page,
        limit,
        interests,
        interest
      );

      if (!user) {
        return NextResponse.json({
          ...result,
          feeds: result.feeds.map((feed) => ({ ...feed, is_scraped: false })),
        });
      }

      const scrapedFeedIds = await getScrapedFeedIds(
        user.id,
        result.feeds.map(({ id }) => id)
      );

      const feedsWithStatus = result.feeds.map((feed) => ({
        ...feed,
        is_scraped: scrapedFeedIds.has(feed.id),
      }));

      return NextResponse.json({ ...result, feeds: feedsWithStatus });
    }
  } catch (error) {
    console.error("피드 API 오류:", error);
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "피드를 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
