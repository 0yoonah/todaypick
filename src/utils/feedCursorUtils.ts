/**
 * 피드 "더보기" 커서.
 *
 * 마지막으로 받은 글의 위치를 담아, 새 글이 들어오거나 오래된 글이 지워져도 중복·누락 없이 이어서 읽는다.
 * 화면은 내용을 몰라도 되고 받은 문자열을 그대로 돌려보낸다. 규칙은 설계 문서의 "커서" 절을 따른다.
 */

/** 최신순 정렬의 마지막 글 위치 */
export type FeedSortKey = { t: string; id: string };

/** 맞춤 정렬 1단계(기간 안)의 마지막 글 위치. sc는 관심 분야 일치 수 */
export type PersonalSortKey = FeedSortKey & { sc: number };

export type DateCursor = { v: 1; m: "d" } & FeedSortKey;

export type PersonalCursor = {
  v: 1;
  m: "p";
  /** 맞춤 기간 시작. 첫 요청에서 정해 스크롤 내내 유지한다. */
  s: string;
  /** 첫 요청 시각. 이후 수집된 글은 이 스크롤에 넣지 않는다. */
  u: string;
  ph: 1 | 2;
  k?: { sc?: number; t: string; id: string };
};

export type FeedCursor = DateCursor | PersonalCursor;

// URL id가 길 수 있어 넉넉히 잡되, 비정상적으로 큰 입력은 파싱 전에 거른다.
export const MAX_FEED_CURSOR_LENGTH = 4096;
const MAX_ID_LENGTH = 2048;

const INVALID_CURSOR_MESSAGE = "유효하지 않은 커서입니다.";

function invalid(): never {
  throw new TypeError(INVALID_CURSOR_MESSAGE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTime(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    invalid();
  }
  return value;
}

function readId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ID_LENGTH) {
    invalid();
  }
  return value;
}

export function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeFeedCursor(value: string): FeedCursor {
  if (value.length === 0 || value.length > MAX_FEED_CURSOR_LENGTH) invalid();
  if (!/^[A-Za-z0-9_-]+$/.test(value)) invalid();

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    invalid();
  }

  if (!isRecord(parsed) || parsed.v !== 1) invalid();

  if (parsed.m === "d") {
    return { v: 1, m: "d", t: readTime(parsed.t), id: readId(parsed.id) };
  }

  if (parsed.m !== "p" || (parsed.ph !== 1 && parsed.ph !== 2)) invalid();

  const cursor: PersonalCursor = {
    v: 1,
    m: "p",
    s: readTime(parsed.s),
    u: readTime(parsed.u),
    ph: parsed.ph,
  };

  if (parsed.k !== undefined) {
    if (!isRecord(parsed.k)) invalid();
    const key = { t: readTime(parsed.k.t), id: readId(parsed.k.id) };

    if (cursor.ph === 1) {
      const score = parsed.k.sc;
      if (typeof score !== "number" || !Number.isInteger(score) || score < 0) {
        invalid();
      }
      cursor.k = { sc: score, ...key };
    } else {
      cursor.k = key;
    }
  }

  return cursor;
}

/**
 * 맞춤 정렬 1단계 순서. 음수면 a가 먼저 온다.
 * 관심 분야 일치 수 내림차순 → 발행 시각 내림차순 → id 오름차순.
 */
export function comparePersonalKey(a: PersonalSortKey, b: PersonalSortKey): number {
  const scoreDiff = b.sc - a.sc;
  if (scoreDiff) return scoreDiff;

  const timeDiff = Date.parse(b.t) - Date.parse(a.t);
  if (timeDiff) return timeDiff;

  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}
