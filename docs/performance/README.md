# 성능 측정 기록

성능을 바꾼 작업의 전후를 측정한 기록입니다. 측정 건마다 문서를 하나씩 두고, 공통 방법은 이 문서에 둡니다.

## 기록

| 날짜 | 문서 | 비교 | 핵심 결과 |
| --- | --- | --- | --- |
| 2026-10-14 | [피드 DB 저장과 함수 지역 변경](2026-10-14-feed-db-collection.md) | v1.12.1 → v1.13.1 | 캐시 만료 뒤 첫 요청 7.8초 → 항상 약 0.2초, 피드 API 0.41초 → 0.21초 |
| 2026-10-14 | [피드 첫 페이지 서버 렌더링](2026-10-14-feed-ssr.md) | v1.13.1 → v1.13.2 | Lighthouse LCP 모바일 7.6초 → 3.9초, 데스크톱 2.1초 → 1.3초 |

## 원칙

- **Production에서 잽니다.** 사용자가 겪는 속도는 Production 환경(함수 지역, Vercel 캐시, 정적 파일 다운로드)에서 결정됩니다. 로컬 비교는 참고 자료로만 씁니다.
- 이전 버전도 Production 배포 그대로 잽니다. 이전 배포 주소는 보호돼 있어 측정하는 동안만 Deployment Protection을 끄고, 끝나면 바로 다시 켭니다.
- 같은 날, 같은 도구와 설정으로 잰 값끼리 비교합니다.
- 여러 번 재서 범위와 중앙값을 함께 적습니다.
- 사용자가 보는 화면은 LCP로 판단합니다. 내부 시점(DOM에 카드가 생긴 시각 등)은 보조 지표입니다.

## 측정 방법

1. 이전 배포 주소는 GitHub Deployments(`gh api repos/0yoonah/todaypick/deployments?environment=Production`)의 상태에서 찾습니다. 보호된 주소라 측정하는 동안 Deployment Protection을 끄고, 끝나면 다시 켭니다.
2. 함수 지역: 응답 헤더 `x-vercel-id`의 두 번째 값
3. API: `curl -o /dev/null -w "%{time_total}" "<주소>/api/feeds?category=tech_blog&limit=12"`를 연속 10회. 이전 버전의 캐시 만료 상태는 마지막 요청 뒤 16분 이상 기다렸다가 1회
4. Lighthouse: `npx lighthouse@12.8.2 "<주소>/feeds?category=tech_blog" --only-categories=performance [--preset=desktop] --chrome-flags="--headless=new" --output=json`, 각 3회
5. 로컬 비교가 필요하면 태그를 `git worktree add`로 꺼내 `next build` 후 `next start`로 띄웁니다. 서버 캐시 없는 상태는 서버를 다시 시작하고 `.next/cache/fetch-cache`를 지웁니다.

## 새 기록을 추가할 때

1. `YYYY-MM-DD-주제.md`로 문서를 만들고 위 "기록" 표에 한 줄을 더합니다.
2. 문서에는 비교 대상(버전, 배포, 함수 지역), 측정 조건, 결과, 한계, 남은 개선점을 적습니다.
3. 관련 릴리스 노트에서 문서로 연결합니다.
