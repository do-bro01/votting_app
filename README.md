# 투표 앱 (Voting App)

동아리·학생회 같은 소규모 조직을 위한 간단한 투표 웹앱입니다. 운영자가 질문과 선택지로 투표를 올리면, 구성원은 로그인 없이 선택지 하나를 골라 투표하고 결과를 그래프로 확인합니다.

인공지능서비스개발2 4주차 SDD(Spec-Driven Development) 실습 과제로, [Matt Pocock's Skills](https://aihero.dev/skills)의 흐름(`/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`)을 따라 만들었습니다.

만든 사람: 김도형

## 기능

- **투표 목록** (`/`): 모든 투표를 최신순으로 보여줍니다. 마감 시각과 마감 여부도 함께 표시합니다.
- **운영자 로그인** (`/login`): 운영자 비밀번호 하나를 운영자끼리 공유합니다. 로그인은 브라우저를 닫을 때까지 유지되고, 상단의 "나가기"로 로그아웃합니다.
- **투표 만들기** (`/new`, 운영자만): 질문 하나와 선택지 2~5개를 입력하고, 마감 시각은 선택해서 넣을 수 있습니다.
- **투표하기** (`/polls/[id]`, 누구나): 선택지 하나를 골라 표를 던집니다. 마감된 투표는 선택지와 버튼이 비활성화되고, 서버도 표를 거부합니다.
- **결과 보기** (`/polls/[id]/results`, 누구나): 선택지별 득표수와 퍼센트를 가로 막대 그래프로 보여주고, 전체 표 수도 함께 표시합니다.
- **투표 삭제** (운영자만): 투표하기 화면에서 확인 단계를 거쳐 삭제합니다. 선택지와 표도 함께 지워집니다.

투표자는 익명이고, 중복 투표는 의도적으로 막지 않습니다. 이유는 [ADR-0001](docs/adr/0001-anonymous-voting-without-duplicate-prevention.md)에 있습니다.

## 기술 스택

- Next.js 16 (App Router, Route Handlers), React 19, TypeScript, Tailwind CSS 4
- Neon Postgres (`@neondatabase/serverless`, ORM 없이 raw SQL, [ADR-0002](docs/adr/0002-raw-sql-without-orm.md))
- Playwright E2E 테스트

## 로컬에서 실행하기

1. 의존성을 설치합니다.
   ```bash
   npm install
   ```
2. 프로젝트 루트에 `.env.local`을 만듭니다. 이 파일은 Git에 올라가지 않습니다.
   ```
   DATABASE_URL=postgresql://...        # Neon 연결 문자열
   ADMIN_TOKEN=<운영자 비밀번호>          # 수업에서 안내한 값
   ```
3. DB에 테이블을 만듭니다. Neon SQL Editor에서 `db/schema.sql`을 실행해도 됩니다.
   ```bash
   npm run db:schema
   ```
   이미 만들어 둔 DB라면 스키마 대신 마이그레이션만 적용합니다.
   ```bash
   npm run db:migrate db/migrations/001-add-closes-at.sql
   ```
4. 개발 서버를 실행하고 http://localhost:3000 을 엽니다.
   ```bash
   npm run dev
   ```

## 스크립트

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run test` | Playwright E2E 전체 실행 (개발 서버를 3100 포트로 자동으로 띄움) |
| `npm run typecheck` | 라우트 타입 생성 + TypeScript 검사 |
| `npm run lint` | ESLint |
| `npm run db:schema` | `db/schema.sql`을 `.env.local`의 DB에 적용 |
| `npm run db:migrate <파일>` | 마이그레이션 SQL 파일 하나 적용 |

**테스트 참고**
- 테스트는 `.env.local`의 DB와 `ADMIN_TOKEN`을 그대로 씁니다.
- 테스트가 만든 투표는 질문이 `[e2e]`로 시작하고, 실행이 끝나면 자동으로 지워집니다.
- 처음 실행하기 전에 브라우저를 한 번 설치해야 합니다: `npx playwright install chromium`

## 배포 (Vercel)

1. Vercel에서 이 GitHub 저장소를 Import합니다.
2. Neon Integration으로 DB를 연결하면 `DATABASE_URL`이 자동으로 들어갑니다. 연결한 DB에 테이블이 없다면 Neon SQL Editor에서 `db/schema.sql`을 실행합니다.
3. **Settings → Environment Variables**에서 `ADMIN_TOKEN`을 추가합니다.
4. 환경변수를 바꾼 뒤에는 **Deployments → Redeploy**를 눌러야 반영됩니다.

이후에는 `main`에 push할 때마다 자동으로 다시 배포됩니다.

## 문서

| 위치 | 내용 |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | 도메인 용어집 (투표, 선택지, 표, 운영자, 마감 시각 등) |
| [docs/adr/](docs/adr/) | 되돌리기 어려운 설계 결정과 그 이유 |
| [.scratch/](.scratch/) | 기능별 스펙(`spec.md`)과 티켓(`issues/`) |
| [docs/agents/](docs/agents/) | AI 에이전트 스킬 설정 (이슈 트래커, 라벨, 도메인 문서 규칙) |

기능별 스펙:
- [투표 앱 MVP](.scratch/voting-app-mvp/spec.md)
- [투표 마감 시각 + 결과 그래프](.scratch/poll-deadline-and-chart/spec.md)
- [운영자 비밀번호 + 투표 삭제](.scratch/operator-password/spec.md)
