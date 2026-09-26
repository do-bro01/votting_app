# 01: 운영자 → 구성원·입장 비밀번호로 용어 정리 (prefactor)

**What to build:** 동작은 그대로 두고, 코드·API 경로·화면 문구의 "운영자"를 CONTEXT.md의 구성원(Member)·입장 비밀번호(Entry Password)로 바꾼다. 입장 서명(순수)과 입장 세션(server-only) 모듈로 나눠 02에서 Proxy가 서명 모듈을 쓸 수 있게 한다. 입장 화면 문구("투표 앱", "입장 비밀번호", "입장")와 API 경로(`/api/login`, `/api/logout`)도 이 티켓에서 바꾼다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 코드·테스트·화면에 "운영자/operator"가 남아 있지 않다(환경변수 `ADMIN_TOKEN` 제외)
- [ ] 입장 서명 모듈은 `next/headers`·`server-only`에 의존하지 않는다
- [ ] `/api/login`·`/api/logout`이 기존 로그인 API와 같은 상태 코드로 동작하고, 옛 경로는 없다
- [ ] 입장 화면: 제목 "투표 앱", 라벨 "입장 비밀번호", 버튼 "입장"
- [ ] 기존 테스트가 새 문구·경로로 모두 통과한다
