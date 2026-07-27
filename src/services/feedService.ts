import { createClient } from "@/utils/supabase/client";
import { Feed } from "@/types/feed";

// 메인 서비스 클래스
export class FeedService {
  private supabase = createClient();

  // 스크랩 관련 메서드들
  async scrapFeed(feed: Feed) {
    const { data: user } = await this.supabase.auth.getUser();

    if (!user.user) {
      throw new Error("로그인이 필요합니다.");
    }

    const isScraped = await this.isFeedScraped(feed.id);
    const scrapedFeedsTable = this.supabase.from("scraped_feeds");

    if (isScraped) {
      const { error } = await scrapedFeedsTable
        .delete()
        .eq("user_id", user.user.id)
        .eq("feed->>id", feed.id);

      if (error) {
        console.error("스크랩 해제 실패:", error);
        throw error;
      }
    } else {
      const { error } = await scrapedFeedsTable.insert({
        user_id: user.user.id,
        feed: feed,
      });

      if (error) {
        console.error("피드 스크랩 실패:", error);
        throw error;
      }
    }
  }

  async unscrapFeed(feedId: string) {
    const { data: user } = await this.supabase.auth.getUser();

    if (!user.user) {
      throw new Error("로그인이 필요합니다.");
    }

    const { error } = await this.supabase
      .from("scraped_feeds")
      .delete()
      .eq("user_id", user.user.id)
      .eq("feed->>id", feedId);

    if (error) {
      console.error("스크랩 해제 실패:", error);
      throw error;
    }
  }

  async isFeedScraped(feedId: string): Promise<boolean> {
    const { data: user } = await this.supabase.auth.getUser();

    if (!user.user) {
      return false;
    }

    const { data, error } = await this.supabase
      .from("scraped_feeds")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("feed->>id", feedId);

    if (error) {
      console.error("스크랩 상태 확인 실패:", error);
      return false;
    }

    return data && data.length > 0;
  }
}

export const feedService = new FeedService();
