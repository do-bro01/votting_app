-- 부록: 투표 마감 시각. 기존 투표는 null(무기한)로 남는다.
alter table polls add column if not exists closes_at timestamptz;
