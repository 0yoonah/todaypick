# RSS v1.5.0 통합 검증 기록

## 검증 범위

- 정상 RSS와 잘못된 XML의 부분 실패 격리
- 타임아웃 소스와 정상 소스의 동시 수집
- 리다이렉트 대상 URL 재검증
- HTML 설명의 스크립트·스타일 제거
- 중복 URL 제거와 발행일 누락 데이터의 결정적 정렬
- 카테고리별 서버 캐시 분리와 동일 카테고리 캐시 적중
- 설정으로 비활성화한 소스의 수집 제외
- 피드 스크랩 캐시, 관심 분야 정렬, RSS 보안 유틸 회귀

## 요청 수와 캐시 결과

통합 테스트는 외부 네트워크 대신 계측 가능한 `fetch` 대역을 사용한다.
동일 카테고리를 연속 두 번 조회하고 다른 카테고리를 한 번 조회한 결과는
다음과 같다.

| 시나리오 | 캐시가 없을 때 예상 요청 | 현재 구현 요청 |
| --- | ---: | ---: |
| `tech_blog` 동일 조건 2회 | 2회 | 1회 |
| `tech_blog` 1회 + `it_news` 1회 | 2회 | 2회 |

카테고리 캐시 적중 시 두 번째 조회는 추가 RSS 요청을 만들지 않는다. 다른
카테고리는 별도 캐시 키를 사용하므로 첫 조회에서 독립적으로 요청한다. 클라이언트
피드 쿼리는 15분 `staleTime`, 30분 `gcTime`을 사용한다.

로컬 모킹 환경의 단일 RSS 통합 테스트 파일 실행 시간은 개발 환경과 실행 시점에
따라 달라지므로 절대 성능 기준으로 사용하지 않는다. PR에는 테스트 출력의 실제
시간을 기록하고, Vercel Preview에서 사용자 경로를 다시 확인한다.

## 재현 명령

```bash
npm test -- src/services/rssFeedService.test.ts
npm run lint
npm run type-check
npm test
npm run build
```

## 소스 장애 대응

1. `src/data/feeds.ts`에서 장애 또는 삭제 요청 대상 소스를 찾는다.
2. 해당 항목에 `enabled: false`를 추가한다.
3. `npm test -- src/data/feeds.test.ts src/services/rssFeedService.test.ts`를 실행한다.
4. 배포 후 일반 피드에서 대상 소스가 제외됐는지 확인한다.
5. 복구할 때는 `enabled`를 제거하거나 `true`로 변경하고 같은 검증을 반복한다.

소스 하나의 XML 오류, 타임아웃, HTTP 오류는 빈 결과로 격리하며 다른 소스의
정상 결과를 유지한다. 신규 RSS 저장 DB, migration, Cron secret 또는 예약 작업은
필요하지 않다.
