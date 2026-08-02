import type { InterestId } from "@/config/interests";
import type { Feed } from "@/types/feed";

export type WritingSource = Pick<
  Feed,
  "id" | "title" | "url" | "source" | "category" | "published_at" | "interests"
>;

export type WritingDraft = {
  id: string;
  title: string;
  content: string;
  tags: InterestId[];
  sources: WritingSource[];
  created_at: string;
  updated_at: string;
};
