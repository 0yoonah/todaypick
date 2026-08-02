import type { Feed } from "@/types/feed";

export function prepareFeedForStorage(feed: Feed): Feed {
  const feedForStorage = { ...feed };
  delete feedForStorage.image_url;
  return feedForStorage;
}
