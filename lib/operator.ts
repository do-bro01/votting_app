import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// 운영자(Operator) 세션 모듈 (ADR-0003).
// 운영자 비밀번호는 환경변수 ADMIN_TOKEN 하나이고, 로그인하면 브라우저를 닫을 때까지 유지되는 세션 쿠키를 준다.
// 쿠키에는 비밀번호가 아니라 비밀번호로 만든 서명값을 담으므로, 비밀번호를 바꾸면 모든 세션이 무효가 된다.

const COOKIE_NAME = "operator_session";

function operatorPassword() {
  return process.env.ADMIN_TOKEN ?? "";
}

function sessionToken(password: string) {
  return createHmac("sha256", password).update("operator-session").digest("hex");
}

// 길이가 달라도 쓸 수 있게 해시한 뒤 상수 시간으로 비교한다.
function safeEqual(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function isOperatorPassword(input: string) {
  const password = operatorPassword();
  // 비밀번호가 설정되지 않았으면 아무도 로그인할 수 없다.
  if (password === "") return false;
  return safeEqual(input, password);
}

export async function isOperator() {
  const password = operatorPassword();
  if (password === "") return false;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token !== undefined && safeEqual(token, sessionToken(password));
}

export async function startOperatorSession() {
  // expires·maxAge를 주지 않아 브라우저를 닫으면 사라지는 세션 쿠키가 된다.
  (await cookies()).set(COOKIE_NAME, sessionToken(operatorPassword()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function endOperatorSession() {
  (await cookies()).delete(COOKIE_NAME);
}

// 로그인 뒤 돌아갈 주소. 같은 사이트 안의 경로만 허용해 외부 사이트로 보내지 않는다.
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
