import type { InterestId } from "@/config/interests";
import type { Feed } from "@/types/feed";

const INTEREST_KEYWORDS: Record<InterestId, string[]> = {
  frontend: [
    "frontend",
    "프론트엔드",
    "react",
    "next.js",
    "vue",
    "javascript",
    "typescript",
    "css",
    "웹",
    "브라우저",
    "ui",
  ],
  backend: [
    "backend",
    "백엔드",
    "서버",
    "api",
    "database",
    "데이터베이스",
    "spring",
    "java",
    "node.js",
    "python",
    "아키텍처",
  ],
  ai_data: [
    "ai",
    "인공지능",
    "머신러닝",
    "machine learning",
    "llm",
    "데이터",
    "딥러닝",
    "모델",
    "분석",
  ],
  infra_devops: [
    "devops",
    "인프라",
    "클라우드",
    "cloud",
    "aws",
    "kubernetes",
    "쿠버네티스",
    "docker",
    "배포",
    "observability",
    "운영",
  ],
  security: [
    "보안",
    "security",
    "취약점",
    "암호",
    "인증",
    "해킹",
    "개인정보",
    "제로트러스트",
  ],
  career: [
    "커리어",
    "채용",
    "개발자",
    "성장",
    "조직문화",
    "협업",
    "면접",
    "이직",
    "리더십",
  ],
};

export function inferFeedInterests(
  feed: Pick<Feed, "title" | "description" | "source">
): InterestId[] {
  const text = `${feed.title} ${feed.description} ${feed.source}`.toLowerCase();

  return (Object.entries(INTEREST_KEYWORDS) as [InterestId, string[]][])
    .filter(([, keywords]) =>
      keywords.some((keyword) => text.includes(keyword.toLowerCase()))
    )
    .map(([interest]) => interest);
}

export function sortFeedsByInterests(
  feeds: Feed[],
  selectedInterests: InterestId[]
): Feed[] {
  if (selectedInterests.length === 0) return feeds;

  const selected = new Set(selectedInterests);
  const score = (feed: Feed) =>
    feed.interests?.reduce(
      (total, interest) => total + Number(selected.has(interest)),
      0
    ) ?? 0;

  return [...feeds].sort((a, b) => {
    const interestDiff = score(b) - score(a);
    if (interestDiff) return interestDiff;

    const publishedDiff =
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    return publishedDiff || a.id.localeCompare(b.id);
  });
}
