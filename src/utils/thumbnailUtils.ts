import { LEGACY_DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";
import type { InterestId } from "@/config/interests";

// 역할 기반 토큰만 조합한다. 색은 구분을 돕는 장식이고 의미는 함께 표시하는 텍스트가 전달한다.
export const PLACEHOLDER_TONES = [
  "bg-primary/10 text-primary",
  "bg-info/10 text-info",
  "bg-correct/10 text-correct",
  "bg-warning/15 text-foreground",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
] as const;

export type PlaceholderTone = (typeof PLACEHOLDER_TONES)[number];

// 관심 분야마다 색상 계열이 겹치지 않게 고정한다.
const INTEREST_TONES: Record<InterestId, PlaceholderTone> = {
  ai_data: "bg-primary/10 text-primary",
  frontend: "bg-info/10 text-info",
  infra_devops: "bg-correct/10 text-correct",
  security: "bg-warning/15 text-foreground",
  career: "bg-accent text-accent-foreground",
  backend: "bg-secondary text-secondary-foreground",
};

/** 같은 값은 늘 같은 톤이 되도록 문자열 해시로 고른다. */
export function getPlaceholderTone(seed: string): PlaceholderTone {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length];
}

/** 관심 분야가 있으면 분야별 톤, 없으면 출처 이름으로 톤을 고른다. */
export function getFeedPlaceholderTone(
  interest: InterestId | undefined,
  source: string
): PlaceholderTone {
  return interest ? INTEREST_TONES[interest] : getPlaceholderTone(source);
}

/** 실제로 보여 줄 이미지가 있는지. 예전 기본 이미지는 이미지가 없는 것으로 본다. */
export function hasDisplayableImage(url: string | null | undefined): boolean {
  return !!url && url !== LEGACY_DEFAULT_FEED_IMAGE_URL;
}
