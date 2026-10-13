import { LEGACY_DEFAULT_FEED_IMAGE_URL } from "@/config/feedImages";

/** 실제로 보여 줄 이미지가 있는지. 예전 기본 이미지는 이미지가 없는 것으로 본다. */
export function hasDisplayableImage(url: string | null | undefined): boolean {
  return !!url && url !== LEGACY_DEFAULT_FEED_IMAGE_URL;
}
