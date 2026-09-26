# ORM 없이 Neon Postgres에 raw SQL을 직접 쓴다

DB 접근은 `@neondatabase/serverless`의 SQL 태그 템플릿으로 raw SQL을 직접 작성하고, Prisma·Drizzle 같은 ORM은 쓰지 않는다. 수업 목표가 테이블·외래키·SQL을 직접 보고 이해하는 것이고, 테이블이 두세 개뿐이라 ORM이 주는 이득보다 추상화 비용이 크기 때문이다. 스키마 변경은 SQL 파일로 남기고 Neon SQL Editor에서 직접 실행한다.
