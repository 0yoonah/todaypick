import Parser from "rss-parser";
import {
  assertRssContentType,
  assertSafeRssUrl,
  assertSafeXml,
  readResponseTextWithLimit,
} from "@/utils/rssSecurityUtils";

// 서비스와 점검 스크립트(scripts/check-feeds.ts)가 함께 쓰므로
// server-only나 next/cache에 의존하지 않는다.

export const RSS_TIMEOUT_MS = 8_000;
const RSS_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const RSS_MAX_REDIRECTS = 3;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

type RssMediaField = { $?: { url?: string; type?: string } };

type RssCustomItem = {
  "media:content"?: RssMediaField;
  "media:thumbnail"?: RssMediaField;
  enclosure?: { url?: string; type?: string };
  "content:encoded"?: string;
  description?: string;
};

export type RssFeed = Parser.Output<RssCustomItem>;
export type RssItem = RssFeed["items"][number];

export type RssSourceResult = {
  finalUrl: string;
  feed: RssFeed;
};

function createRssParser() {
  return new Parser<Record<string, never>, RssCustomItem>({
    customFields: {
      item: [
        "media:content",
        "media:thumbnail",
        "enclosure",
        "content:encoded",
        "description",
      ],
    },
  });
}

async function fetchRssResponse(
  initialUrl: string,
  signal: AbortSignal
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = await assertSafeRssUrl(initialUrl);

  for (let redirectCount = 0; redirectCount <= RSS_MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "TodayPick RSS Reader/1.4",
      },
      redirect: "manual",
      signal,
    });

    if (!REDIRECT_STATUS_CODES.has(response.status)) {
      return { response, finalUrl: currentUrl.toString() };
    }

    const location = response.headers.get("location");
    if (!location || redirectCount === RSS_MAX_REDIRECTS) {
      throw new Error("RSS 리다이렉트 횟수 제한을 초과했습니다.");
    }

    await response.body?.cancel();
    currentUrl = await assertSafeRssUrl(
      new URL(location, currentUrl).toString()
    );
  }

  throw new Error("RSS 요청을 완료하지 못했습니다.");
}

export async function readRssSource(
  rssUrl: string,
  signal: AbortSignal
): Promise<RssSourceResult> {
  const { response, finalUrl } = await fetchRssResponse(rssUrl, signal);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  assertRssContentType(response.headers.get("content-type"));
  const xml = await readResponseTextWithLimit(response, RSS_MAX_RESPONSE_BYTES);
  assertSafeXml(xml);

  return { finalUrl, feed: await createRssParser().parseString(xml) };
}

// 채널 로고(feed.image·logo·icon)는 후보로 쓰지 않는다.
// 글마다 같은 로고가 반복되므로 화면의 대체 썸네일이 더 많은 정보를 준다.
export function getRssItemImageInputs(item: RssItem) {
  return {
    candidates: [
      { url: item.enclosure?.url, type: item.enclosure?.type },
      {
        url: item["media:content"]?.$?.url,
        type: item["media:content"]?.$?.type,
      },
      {
        url: item["media:thumbnail"]?.$?.url,
        type: item["media:thumbnail"]?.$?.type,
      },
    ],
    htmlValues: [
      item["content:encoded"],
      item.content,
      item.description,
      item.summary,
    ],
  };
}
