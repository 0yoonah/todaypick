import { NextRequest, NextResponse } from "next/server";
import { FeedCategory, RSSFeedCategory } from "@/types/feed";
import { createClient } from "@/utils/supabase/server";
import { FEED_CATEGORY } from "@/config/constants";
import { loadFeedPage } from "@/services/feedPageService";
import { decodeFeedCursor } from "@/utils/feedCursorUtils";
import { isInterestId } from "@/config/interests";
import { badRequest, serverError, unauthorized } from "@/utils/apiResponse";

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

  // IT 뉴스·테크 블로그는 커서로 이어 읽는다. 형식은 조회 전에 확인해 400으로 돌려준다.
  const cursor = searchParams.get("cursor") || undefined;
  if (cursor) decodeFeedCursor(cursor);

  // 제목 검색어. 비어 있으면 검색하지 않는다.
  // PostgREST는 like 패턴의 *를 %처럼 다루고 이스케이프할 방법이 없어 글자에서 뺀다.
  const rawQuery = searchParams.get("q")?.trim() || undefined;
  const query = rawQuery?.replace(/\*/g, "").trim();
  if (rawQuery && (!query || query.length < 2 || query.length > 50)) {
    throw new TypeError("검색어는 2자 이상 50자 이하로 입력해 주세요.");
  }

  const category = categoryValue as FeedCategory;
  return { category, page, limit, interest, sourceCategory, cursor, query };
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
    console.error(`스크랩된 피드 조회 실패 (${error.code}): ${error.message}`);
    throw new Error("스크랩한 피드를 불러오지 못했습니다.");
  }

  return {
    feeds:
      scrapedFeeds?.map(({ feed }) => ({ ...feed, is_scraped: true })) || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { category, page, limit, interest, sourceCategory, cursor, query } =
      parseFeedParams(request);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (category === FEED_CATEGORY.SCRAPED) {
      if (!user) {
        return unauthorized();
      }

      const result = await getScrapedFeeds(user.id, page, limit, sourceCategory);
      return NextResponse.json(result, { status: 200 });
    } else {
      const result = await loadFeedPage(supabase, user?.id ?? null, {
        category,
        limit,
        cursor,
        interest,
        query,
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("피드 API 오류:", error);
    if (error instanceof TypeError) {
      return badRequest(error.message);
    }

 return serverError("피드를 불러오는데 실패했습니다.", error);
}
}
