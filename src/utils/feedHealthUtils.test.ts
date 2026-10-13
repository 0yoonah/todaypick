import { describe, expect, it } from "vitest";
import { summarizeFeedHealth } from "./feedHealthUtils";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-13T00:00:00Z");
const daysAgo = (days: number) => NOW - days * DAY_MS;

const baseInput = {
  requestedUrl: "https://example.com/feed.xml",
  finalUrl: "https://example.com/feed.xml",
  publishedAts: [daysAgo(1)],
  disallowedImageHosts: [],
  now: NOW,
};

describe("summarizeFeedHealth", () => {
  it("최근 글 날짜와 90일 이내 글 수를 계산한다", () => {
    const result = summarizeFeedHealth({
      ...baseInput,
      publishedAts: [daysAgo(100), daysAgo(3), daysAgo(90), Number.NaN],
    });

    expect(result.latestPublishedAt).toBe(daysAgo(3));
    expect(result.recentCount).toBe(2);
    expect(result.warnings).toEqual([]);
  });

  it("365일보다 오래되면 stale 경고를 낸다", () => {
    expect(
      summarizeFeedHealth({ ...baseInput, publishedAts: [daysAgo(365)] })
        .warnings
    ).toEqual([]);
    expect(
      summarizeFeedHealth({ ...baseInput, publishedAts: [daysAgo(366)] })
        .warnings
    ).toEqual(["stale"]);
  });

  it("날짜를 읽을 수 있는 글이 없으면 no_dates 경고를 낸다", () => {
    const result = summarizeFeedHealth({
      ...baseInput,
      publishedAts: [Number.NaN],
    });

    expect(result.latestPublishedAt).toBeNull();
    expect(result.warnings).toEqual(["no_dates"]);
  });

  it("최종 URL이 다르면 redirected 경고를 낸다", () => {
    expect(
      summarizeFeedHealth({
        ...baseInput,
        finalUrl: "https://example.com/feed.xml/",
      }).warnings
    ).toEqual(["redirected"]);
  });

  it("허용 목록 밖 이미지 호스트가 있으면 경고를 낸다", () => {
    expect(
      summarizeFeedHealth({
        ...baseInput,
        disallowedImageHosts: ["img.example.com"],
      }).warnings
    ).toEqual(["disallowed_image_host"]);
  });
});
