# RSS 예약 수집 운영

RSS 글을 3시간마다 수집해 `feed_items`에 저장하는 구조와 운영 절차입니다.
설계 배경은 [설계 문서](superpowers/specs/2026-10-14-feed-db-collection-design.md)를 봅니다.
전환 전후 성능 측정은 [feed-performance-v1.13.md](feed-performance-v1.13.md)에 있습니다.

## 구조

```
pg_cron collect-feeds (5 */3 * * *, UTC)
  └─ pg_net: POST https://tdpick.vercel.app/api/feeds/collect
       Authorization: Bearer <Vault feed_collector_secret>
         └─ 수집 API: FEED_COLLECTOR_SECRET과 비교 → RSS 수집
              └─ upsert_feed_items(p_secret, p_items): Vault 값과 다시 비교 → 저장 → 1년 지난 글 삭제
```

- 피드 화면은 `feed_items`에서 읽습니다. 수집이 멈춰도 저장된 글은 그대로 보입니다.
- 비밀값은 Vault(`feed_collector_secret`)와 Vercel 환경 변수(`FEED_COLLECTOR_SECRET`) 두 곳에 **같은 값**으로 둡니다. 코드와 migration에는 넣지 않습니다.
- 서비스 롤 키는 쓰지 않습니다. `feed_items`에 쓰는 길은 비밀값을 확인하는 `upsert_feed_items` 하나뿐입니다.

## 처음 설정

릴리스 PR을 병합하기 전에 한 번 합니다.

1. 비밀값을 만듭니다. 출력은 어디에도 붙여 넣지 말고 아래 두 곳에만 씁니다.

   ```bash
   openssl rand -hex 32
   ```

2. Supabase SQL Editor에서 migration `supabase/migrations/20261014090000_add_feed_items.sql`을 적용합니다.
3. 같은 SQL Editor에서 Vault에 비밀값을 등록합니다.

   ```sql
   select vault.create_secret('<비밀값>', 'feed_collector_secret', 'RSS 수집 API 호출용');
   ```

   등록한 값을 함수가 읽을 수 있는지 확인합니다. `1`이 나와야 합니다. 값 자체는 출력하지 않습니다.

   ```sql
   select count(*) from vault.decrypted_secrets where name = 'feed_collector_secret';
   ```

4. Vercel 프로젝트 환경 변수 `FEED_COLLECTOR_SECRET`에 같은 값을 Production과 Preview로 등록합니다.

migration 적용 후 릴리스 전까지는 예약 작업이 아직 배포되지 않은 수집 주소를 불러 404가 납니다. 해는 없습니다.

## 첫 수집

릴리스 배포가 끝나면 바로 실행합니다. 실행하지 않으면 다음 예약 시각까지 최대 3시간 동안 피드가 비어 있습니다.

```sql
select net.http_post(
  url := 'https://tdpick.vercel.app/api/feeds/collect',
  body := '{}'::jsonb,
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'feed_collector_secret')
  ),
  timeout_milliseconds := 60000
);
```

## 결과 확인

```sql
-- 최근 호출 응답 (6시간 보관). status_code 200과 content를 봅니다.
-- upserted는 새로 넣었거나 내용이 바뀐 글 수입니다. 바뀐 것이 없으면 0일 수 있습니다.
select created, status_code, error_msg, left(content, 300) as content
from net._http_response
order by created desc
limit 5;

-- 예약 작업 실행 기록
select start_time, status, return_message
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'collect-feeds')
order by start_time desc
limit 5;

-- 카테고리별 저장 글 수와 최신 수집 시각
select category, count(*), max(collected_at)
from public.feed_items
group by category;
```

| 증상 | 원인 | 조치 |
| --- | --- | --- |
| `status_code` 401 | Vault와 Vercel의 비밀값이 다르거나 Vercel 값이 없음 | 두 값을 같게 맞추고 Vercel 재배포 |
| `status_code` 500, 응답 `수집 설정이 없습니다` | Vercel `FEED_COLLECTOR_SECRET` 없음 | 환경 변수 등록 후 재배포 |
| `status_code` 500, 응답 `수집한 글을 저장하지 못했습니다` | `upsert_feed_items` 오류 (Vault 값 불일치 포함) | Vercel 함수 로그에서 원인 확인 |
| `status_code` 500, 응답 `RSS를 하나도 수집하지 못했습니다` | 모든 출처 요청 실패 (Vercel 네트워크 장애 등) | 함수 로그의 실패 출처 확인, 다음 예약 실행 결과 확인 |
| `error_msg`에 timeout | 수집이 60초를 넘음 | 함수 로그에서 느린 출처 확인 |
| 응답의 `failed`에 출처 id | 해당 출처 RSS 실패 | `npm run check:feeds`로 확인. 다른 출처는 정상 저장됨 |

## 주기 변경

```sql
select cron.schedule('collect-feeds', '<새 cron 식>', (select command from cron.job where jobname = 'collect-feeds'));
```

GeekNews RSS는 최신 50개(약 하루 분량)만 주므로 12시간보다 길게 잡지 않습니다. 바꾼 값은 다음 migration에도 반영합니다.

## 출처 단위 삭제

권리자 요청이나 출처 제거로 저장된 글을 지울 때 실행합니다. 화면에서는 `src/data/feeds.ts`에서 출처를 `enabled: false`로 바꾸거나 지우면 바로 숨겨집니다.

```sql
delete from public.feed_items where source_id = '<출처 id>';
```

## 되돌리기

1. 릴리스 PR을 되돌리면 이전 코드(요청 때 RSS 수집)로 돌아갑니다. 이전 코드는 `feed_items`를 쓰지 않아 테이블을 남겨 둬도 됩니다.
2. 예약 작업을 끕니다.

   ```sql
   select cron.unschedule('collect-feeds');
   ```
