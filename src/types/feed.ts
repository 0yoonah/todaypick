import { FEED_CATEGORY } from "@/config/constants";
import type { InterestId } from "@/config/interests";

export type FeedCategory = (typeof FEED_CATEGORY)[keyof typeof FEED_CATEGORY];
export type RSSFeedCategory = Exclude<
  FeedCategory,
  typeof FEED_CATEGORY.SCRAPED
>;

export type Feed = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  category: FeedCategory;
  is_scraped?: boolean;
  image_url?: string;
  author?: string;
  interests?: InterestId[];
};

export type FeedSource = {
  id: string;
  name: string;
  rss_url: string;
  category: RSSFeedCategory;
  enabled?: boolean;
};

export type FeedRead = {
  id: string;
  feed: Pick<
    Feed,
    | "id"
    | "title"
    | "source"
    | "url"
    | "category"
    | "published_at"
    | "interests"
  >;
  read_date: string;
  first_read_at: string;
  last_read_at: string;
  read_count: number;
};

export type FeedReadPage = {
  reads: FeedRead[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};
