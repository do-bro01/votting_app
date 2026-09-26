# 01: 마감 시각 정하기 (스키마 + 만들기 폼 + 표시)

**What to build:** 투표를 만들 때 마감 시각(Closing Time)을 선택적으로 입력할 수 있다. 입력하면 투표하기 화면과 목록에 "마감: <한국 시간>"이 보이고, 비워 두면 지금처럼 무기한 열려 있다. `polls`에 nullable `closes_at` 컬럼을 추가하는 마이그레이션을 개발 DB에 적용한다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 마이그레이션 SQL이 저장소에 있고 `db/schema.sql`에도 반영되며 개발 DB에 적용되어 있다
- [ ] 폼에서 미래 마감 시각을 넣어 만들면 투표하기 화면과 목록에 "마감: <한국 시간>"이 보인다
- [ ] 마감 시각 없이 만든 투표는 마감 표시가 없고 기존 테스트가 모두 통과한다
- [ ] 과거 마감 시각은 폼에서 "마감 시각은 지금 이후여야 합니다."로 거부된다
- [ ] API에 과거·형식 오류 `closesAt`을 보내면 400
- [ ] `GET /api/polls/[id]`가 `closesAt`(ISO 또는 null)과 `isClosed`를 돌려준다
