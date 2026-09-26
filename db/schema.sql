-- 투표 앱 스키마. Neon SQL Editor에서 실행하거나 `npm run db:schema`로 적용한다.

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  position integer not null,
  vote_count integer not null default 0,
  unique (poll_id, position)
);
