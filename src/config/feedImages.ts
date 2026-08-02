export const FEED_IMAGE_HOSTNAMES = [
  "cdn.medium.com",
  "miro.medium.com",
  "*.medium.com",
  "d2.naver.com",
  "blog.banksalad.com",
  "toss.tech",
  "static.toss.im",
  "tech.kakao.com",
  "tech.kakaoenterprise.com",
  "techblog.woowahan.com",
  "tech.devsisters.com",
  "techblog.lycorp.co.jp",
  "meetup.toast.com",
  "techblog.lotteon.com",
  "techblog.gccompany.co.kr",
  "netmarble.engineering",
  "engineering-skcc.github.io",
  "hyperconnect.github.io",
  "tech.inflab.com",
  "techblog.yogiyo.co.kr",
  "www.itdaily.kr",
  "it.donga.com",
  "social.news.hada.io",
  "d2908q01vomqb2.cloudfront.net",
  "images.unsplash.com",
] as const;

function matchesHostname(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) return hostname === pattern;

  const suffix = pattern.slice(1);
  return hostname.endsWith(suffix) && hostname.length > suffix.length;
}

export function isAllowedFeedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      FEED_IMAGE_HOSTNAMES.some((hostname) =>
        matchesHostname(url.hostname, hostname)
      )
    );
  } catch {
    return false;
  }
}
