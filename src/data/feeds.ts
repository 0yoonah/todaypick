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
    rss_url: "https://techblog.woowahan.com/feed/",
    category: "tech_blog",
  },
  {
    id: "kakao",
    name: "카카오",
    rss_url: "https://tech.kakao.com/feed",
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
    id: "gccompany",
    name: "여기어때",
    rss_url: "https://techblog.gccompany.co.kr/feed",
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
    name: "네이버 플레이스",
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
    id: "44bits",
    name: "44BITS",
    rss_url: "https://www.44bits.io/feed.xml",
    category: "tech_blog",
  },
  {
    id: "aws-tech",
    name: "AWS 기술 블로그",
    rss_url: "https://aws.amazon.com/ko/blogs/tech/feed/",
    category: "tech_blog",
  },
  {
    id: "kakaobank",
    name: "카카오뱅크",
    rss_url: "https://tech.kakaobank.com/index.xml",
    category: "tech_blog",
  },
  {
    id: "flex",
    name: "flex",
    rss_url: "https://flex.team/blog/category/tech/rss.xml",
    category: "tech_blog",
  },
  {
    id: "samsung",
    name: "삼성전자",
    rss_url: "https://techblog.samsung.com/rss",
    category: "tech_blog",
  },
  {
    id: "miridih",
    name: "미리디",
    rss_url: "https://medium.com/feed/miridih",
    category: "tech_blog",
  },
  {
    id: "bbros",
    name: "비브로스",
    rss_url: "https://boostbrothers.github.io/rss.xml",
    category: "tech_blog",
  },
  {
    id: "hyperaccel",
    name: "하이퍼엑셀",
    rss_url: "https://hyper-accel.github.io/posts/index.xml",
    category: "tech_blog",
  },
  {
    id: "hancom",
    name: "한글과컴퓨터",
    rss_url: "https://tech.hancom.com/feed/",
    category: "tech_blog",
  },
  {
    id: "cj-onstyle",
    name: "CJ온스타일",
    rss_url: "https://medium.com/feed/cj-onstyle",
    category: "tech_blog",
  },
  {
    id: "skplanet",
    name: "SK플래닛",
    rss_url: "https://techtopic.skplanet.com/rss.xml",
    category: "tech_blog",
  },

  // IT 뉴스
  {
    id: "geeknews",
    name: "GeekNews",
    rss_url: "https://news.hada.io/rss/news",
    category: "it_news",
  },
];

export function getFeedSources(category: RSSFeedCategory): FeedSource[] {
  return feedSources.filter(
    (source) => source.category === category && source.enabled !== false
  );
}

export const feedCategories = [
  {
    id: "it_news",
    name: "IT 뉴스",
    description: "개발자 커뮤니티가 고른 최신 IT 소식",
  },
  {
    id: "tech_blog",
    name: "테크 블로그",
    description: "개발자들의 기술 블로그와 튜토리얼",
  },
];
