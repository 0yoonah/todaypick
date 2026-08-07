-- 홈 체크리스트에 CS 지식 항목을 추가하기 위한 컬럼.
-- 연속 학습일은 reading_goal_completed 기준을 그대로 사용하므로 이 컬럼을 참조하지 않는다.
alter table public.daily_activities
  add column if not exists cs_completed boolean not null default false;

-- 이미 채점 기록이 있는 날짜는 완료로 맞춰 준다.
-- reviewed_at은 UTC라 서울 날짜로 변환한 뒤 비교한다.
update public.daily_activities as activity
set cs_completed = true
from (
  select distinct user_id, (reviewed_at at time zone 'Asia/Seoul')::date as review_date
  from public.cs_reviews
) as reviewed
where activity.user_id = reviewed.user_id
  and activity.date = reviewed.review_date
  and activity.cs_completed = false;
