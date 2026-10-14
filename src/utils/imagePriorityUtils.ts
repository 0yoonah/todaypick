/**
 * 첫 화면에서 우선 로딩할 카드 이미지 개수.
 * LCP 후보는 목록의 첫 카드 하나이며, 나머지는 지연 로딩을 유지한다.
 */
export const LCP_PRIORITY_CARD_COUNT = 1;

/**
 * 목록에서 우선 로딩할 이미지인지 판단한다.
 * @param index 목록에서의 순서
 * @param enabled 첫 화면 목록인지 여부. 화면 아래 목록은 false로 두어 지연 로딩을 유지한다.
 */
export const shouldPrioritizeImage = (index: number, enabled = true): boolean =>
  enabled && index >= 0 && index < LCP_PRIORITY_CARD_COUNT;

/**
 * 지연 로딩하지 않을 카드 이미지 개수. 데스크톱 첫 줄(3열)이 첫 화면에 함께 보이므로
 * 첫 카드가 아닌 이미지가 LCP가 되는 경우에도 늦게 시작하지 않게 한다.
 * 우선순위 힌트(preload)는 첫 카드에만 둔다.
 */
export const EAGER_IMAGE_CARD_COUNT = 3;

export const shouldLoadImageEagerly = (index: number, enabled = true): boolean =>
  enabled && index >= 0 && index < EAGER_IMAGE_CARD_COUNT;
