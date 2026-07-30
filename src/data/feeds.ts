import type { FeedSource, RSSFeedCategory } from "@/types/feed";

export const feedSources: FeedSource[] = [
  {
    id: "musinsa",
    name: "무신사",
    rss_url: "https://medium.com/feed/musinsa-tech",
    category: "tech_blog",
  },
  {
    id: "naver-d2",
    name: "네이버 D2",
    rss_url: "https://d2.naver.com/d2.atom",
    category: "tech_blog",
  },
  {
    id: "woowahan",
    name: "우아한형제들",
    rss_url: "https://techblog.woowahan.com/feed",
    category: "tech_blog",
  },
  {
    id: "kakao-enterprise",
    name: "카카오엔터프라이즈",
    rss_url: "https://tech.kakaoenterprise.com/feed",
    category: "tech_blog",
  },
  {
    id: "kakao",
    name: "카카오",
    rss_url: "https://tech.kakao.com/feed/",
    category: "tech_blog",
  },
  {
    id: "devsisters",
    name: "데브시스터즈",
    rss_url: "https://tech.devsisters.com/rss.xml",
    category: "tech_blog",
  },
  {
    id: "line",
    name: "라인(LINE)",
    rss_url: "https://techblog.lycorp.co.jp/ko/feed/index.xml",
    category: "tech_blog",
  },
  {
    id: "coupang",
    name: "쿠팡",
    rss_url: "https://medium.com/feed/coupang-engineering",
    category: "tech_blog",
  },
  {
    id: "daangn",
    name: "당근마켓",
    rss_url: "https://medium.com/feed/daangn",
    category: "tech_blog",
  },
  {
    id: "toss",
    name: "토스",
    rss_url: "https://toss.tech/rss.xml",
    category: "tech_blog",
  },
  {
    id: "zigbang",
    name: "직방",
    rss_url: "https://medium.com/feed/zigbang",
    category: "tech_blog",
  },
  {
    id: "watcha",
    name: "왓챠",
    rss_url: "https://medium.com/feed/watcha",
    category: "tech_blog",
  },
  {
    id: "banksalad",
    name: "뱅크샐러드",
    rss_url: "https://blog.banksalad.com/rss.xml",
    category: "tech_blog",
  },
  {
    id: "hyperconnect",
    name: "Hyperconnect",
    rss_url: "https://hyperconnect.github.io/feed.xml",
    category: "tech_blog",
  },
  {
    id: "yogiyo",
    name: "요기요",
    rss_url: "https://techblog.yogiyo.co.kr/feed",
    category: "tech_blog",
  },
  {
    id: "nhn-toast",
    name: "NHN Toast",
    rss_url: "https://meetup.toast.com/rss",
    category: "tech_blog",
  },
  {
    id: "lotteon",
    name: "롯데ON",
    rss_url: "https://techblog.lotteon.com/feed",
    category: "tech_blog",
  },
  {
    id: "gmarket",
    name: "지마켓",
    rss_url: "https://ebay-korea.tistory.com/rss",
    category: "tech_blog",
  },
  {
    id: "gccompany",
    name: "여기어때",
    rss_url: "https://techblog.gccompany.co.kr/feed",
    category: "tech_blog",
  },
  {
    id: "netmarble",
    name: "넷마블",
    rss_url: "https://netmarble.engineering/feed",
    category: "tech_blog",
  },
  {
    id: "29cm",
    name: "29cm",
    rss_url: "https://medium.com/feed/@dev29cm",
    category: "tech_blog",
  },
  {
    id: "skcc",
    name: "SK C&C",
    rss_url: "https://engineering-skcc.github.io/feed.xml",
    category: "tech_blog",
  },
  {
    id: "wanted",
    name: "원티드",
    rss_url: "https://medium.com/feed/wantedjobs",
    category: "tech_blog",
  },
  {
    id: "naver-place",
    name: "네이버 플래이스",
    rss_url: "https://medium.com/feed/naver-place-dev",
    category: "tech_blog",
  },
  {
    id: "inflab",
    name: "인프랩",
    rss_url: "https://tech.inflab.com/rss.xml",
    category: "tech_blog",
  },
  {
    id: "aws-tech",
    name: "AWS 기술 블로그",
    rss_url: "https://aws.amazon.com/ko/blogs/tech/feed/",
    category: "tech_blog",
  },
  {
    id: "44bits",
    name: "44BITS",
    rss_url: "https://www.44bits.io/ko/feed/all",
    category: "tech_blog",
  },

  // IT 뉴스 (국내)
  {
    id: "it-daily",
    name: "IT데일리",
    rss_url: "https://www.itdaily.kr/rss/allArticle.xml",
    category: "it_news",
  },
  {
    id: "it-donga",
    name: "IT동아",
    rss_url: "https://it.donga.com/feeds/rss/",
    category: "it_news",
  },
  {
    id: "geeknews",
    name: "GeekNews",
    rss_url: "https://news.hada.io/rss/news",
    category: "it_news",
  },
];

export function getFeedSources(category: RSSFeedCategory): FeedSource[] {
  return feedSources.filter((source) => source.category === category);
}

export const feedCategories = [
  {
    id: "it_news",
    name: "IT 기사",
    description: "최신 IT 뉴스와 업계 동향",
  },
  {
    id: "tech_blog",
    name: "테크 블로그",
    description: "개발자들의 기술 블로그와 튜토리얼",
  },
];
