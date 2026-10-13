const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const ENTITY_PATTERN = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g;

function decodeCodePoint(codePoint: number, original: string): string {
  const isValid =
    codePoint > 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff);
  return isValid ? String.fromCodePoint(codePoint) : original;
}

/**
 * 엔티티를 한 번에 훑어 바꾼다. 순서대로 replace를 이어 붙이면
 * `&amp;quot;`처럼 이중 인코딩된 문자열이 두 번 풀린다.
 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(ENTITY_PATTERN, (match, decimal, hex, name) => {
    if (decimal) return decodeCodePoint(Number.parseInt(decimal, 10), match);
    if (hex) return decodeCodePoint(Number.parseInt(hex, 16), match);
    return NAMED_ENTITIES[name] ?? match;
  });
}

/** RSS 제목·설명·작성자에서 태그를 지우고 엔티티를 풀어 최대 길이로 자른다. */
export function cleanRssText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  const cleaned = decodeHtmlEntities(
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength - 1).trimEnd()}…`
    : cleaned;
}
