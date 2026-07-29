export const INTERESTS = [
  {
    id: "frontend",
    label: "프론트엔드",
    description: "웹 UI, React, 브라우저",
  },
  {
    id: "backend",
    label: "백엔드",
    description: "서버, API, 데이터베이스",
  },
  {
    id: "ai_data",
    label: "AI·데이터",
    description: "인공지능, 머신러닝, 분석",
  },
  {
    id: "infra_devops",
    label: "인프라·DevOps",
    description: "클라우드, 배포, 운영",
  },
  {
    id: "security",
    label: "보안",
    description: "보안 기술과 정책",
  },
  {
    id: "career",
    label: "커리어",
    description: "개발 문화, 성장, 채용",
  },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

const INTEREST_IDS = new Set<string>(INTERESTS.map(({ id }) => id));

export function isInterestId(value: unknown): value is InterestId {
  return typeof value === "string" && INTEREST_IDS.has(value);
}

export function parseInterestIds(value: unknown): InterestId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isInterestId))];
}
