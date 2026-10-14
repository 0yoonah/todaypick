import { describe, expect, it } from "vitest";
import {
  comparePersonalKey,
  decodeFeedCursor,
  encodeFeedCursor,
  type DateCursor,
  type PersonalCursor,
} from "./feedCursorUtils";

const encodeRaw = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

describe("feed cursor", () => {
  it("최신순 커서를 인코딩한 뒤 그대로 읽는다", () => {
    const cursor: DateCursor = {
      v: 1,
      m: "d",
      t: "2026-10-13T00:00:00.000Z",
      id: "https://example.com/a?x=1,2",
    };

    expect(decodeFeedCursor(encodeFeedCursor(cursor))).toEqual(cursor);
  });

  it("맞춤 커서를 단계와 키까지 그대로 읽는다", () => {
    const first: PersonalCursor = {
      v: 1,
      m: "p",
      s: "2026-09-14T00:00:00.000Z",
      u: "2026-10-14T00:00:00.000Z",
      ph: 1,
      k: { sc: 2, t: "2026-10-13T00:00:00.000Z", id: "https://example.com/a" },
    };
    const second: PersonalCursor = { ...first, ph: 2, k: undefined };

    expect(decodeFeedCursor(encodeFeedCursor(first))).toEqual(first);
    expect(decodeFeedCursor(encodeFeedCursor(second))).toEqual({
      v: 1,
      m: "p",
      s: first.s,
      u: first.u,
      ph: 2,
    });
  });

  it.each([
    ["base64가 아님", "!!!"],
    ["JSON이 아님", Buffer.from("not json").toString("base64url")],
    ["버전 다름", encodeRaw({ v: 2, m: "d", t: "2026-10-13T00:00:00.000Z", id: "a" })],
    ["모드 다름", encodeRaw({ v: 1, m: "x", t: "2026-10-13T00:00:00.000Z", id: "a" })],
    ["날짜 형식 아님", encodeRaw({ v: 1, m: "d", t: "어제", id: "a" })],
    ["id 없음", encodeRaw({ v: 1, m: "d", t: "2026-10-13T00:00:00.000Z" })],
    [
      "맞춤 단계 값 이상",
      encodeRaw({ v: 1, m: "p", s: "2026-09-14T00:00:00.000Z", u: "2026-10-14T00:00:00.000Z", ph: 3 }),
    ],
    [
      "맞춤 1단계 키에 점수 없음",
      encodeRaw({
        v: 1,
        m: "p",
        s: "2026-09-14T00:00:00.000Z",
        u: "2026-10-14T00:00:00.000Z",
        ph: 1,
        k: { t: "2026-10-13T00:00:00.000Z", id: "a" },
      }),
    ],
    ["배열", encodeRaw([1, 2])],
    ["너무 김", "a".repeat(5000)],
  ])("잘못된 커서는 TypeError로 거부한다 (%s)", (_label, value) => {
    expect(() => decodeFeedCursor(value)).toThrow(TypeError);
  });
});

it("느슨하게 파싱되는 날짜는 ISO로 맞춰 DB에 형식이 다른 값이 가지 않게 한다", () => {
  const decoded = decodeFeedCursor(encodeRaw({ v: 1, m: "d", t: "1", id: "a" }));

  expect(decoded.m === "d" && decoded.t).toBe(new Date("1").toISOString());
});

describe("comparePersonalKey", () => {
  const key = (sc: number, t: string, id: string) => ({ sc, t, id });

  it("관심 분야 점수가 높은 글이 먼저 온다", () => {
    expect(
      comparePersonalKey(
        key(2, "2026-10-01T00:00:00.000Z", "b"),
        key(1, "2026-10-13T00:00:00.000Z", "a")
      )
    ).toBeLessThan(0);
  });

  it("점수가 같으면 최신 글, 발행 시각도 같으면 id 오름차순", () => {
    expect(
      comparePersonalKey(
        key(1, "2026-10-13T00:00:00.000Z", "b"),
        key(1, "2026-10-01T00:00:00.000Z", "a")
      )
    ).toBeLessThan(0);
    expect(
      comparePersonalKey(
        key(1, "2026-10-13T00:00:00.000Z", "a"),
        key(1, "2026-10-13T00:00:00.000Z", "b")
      )
    ).toBeLessThan(0);
    expect(
      comparePersonalKey(
        key(1, "2026-10-13T00:00:00.000Z", "a"),
        key(1, "2026-10-13T00:00:00.000Z", "a")
      )
    ).toBe(0);
  });
});
