# ORM 없이 Neon Postgres에 raw SQL을 직접 쓴다

DB 접근은 `@neondatabase/serverless`로 raw SQL을 직접 작성하고, Prisma·Drizzle 같은 ORM은 쓰지 않는다. 수업 목표가 테이블·외래키·SQL을 직접 보고 이해하는 것이고, 테이블이 두세 개뿐이라 ORM이 주는 이득보다 추상화 비용이 크기 때문이다. 앱의 SQL은 투표 데이터 모듈 한 곳에만 둔다. 값은 항상 파라미터로 넘기며, 기본은 SQL 태그 템플릿이고 공유 SQL 조각(예: 마감 여부 규칙)을 끼워 넣어야 할 때만 파라미터화된 `sql.query`를 쓴다. 스키마와 마이그레이션은 `db/` 아래 SQL 파일로 남기고 Neon SQL Editor나 SQL 적용 스크립트(`npm run db:schema`, `npm run db:migrate <파일>`)로 실행한다. 예외로 E2E 테스트는 앱이 일부러 막아 둔 상태(과거 마감 시각, 특정 득표수)를 만들거나 테스트 데이터를 정리하려고 DB에 직접 SQL을 쓸 수 있다.
