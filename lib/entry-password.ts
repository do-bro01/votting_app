import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// 입장 비밀번호(Entry Password)와 입장 쿠키 서명 (ADR-0004).
// next/headers에 의존하지 않는 순수 모듈이라 Proxy와 서버 코드가 함께 쓴다.
// Proxy에서도 import하므로 "server-only"를 붙이지 않았다. 클라이언트 컴포넌트에서 import하지 말 것.

export const ENTRY_REQUIRED = "비밀번호를 입력해 주세요.";
// 쿠키에는 비밀번호가 아니라 비밀번호로 만든 서명값을 담으므로, 비밀번호를 바꾸면 모든 입장이 무효가 된다.

export const ENTRY_COOKIE = "entry_session";

function entryPassword() {
  return process.env.ADMIN_TOKEN ?? "";
}

export function entrySignature() {
  return createHmac("sha256", entryPassword()).update("entry-session").digest("hex");
}

// 길이가 달라도 쓸 수 있게 해시한 뒤 상수 시간으로 비교한다.
function safeEqual(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

// 비밀번호가 설정되지 않았으면 아무도 들어올 수 없다.
export function isEntryPassword(input: string) {
  const password = entryPassword();
  return password !== "" && safeEqual(input, password);
}

export function isValidEntrySignature(value: string | undefined) {
  return entryPassword() !== "" && value !== undefined && safeEqual(value, entrySignature());
}
