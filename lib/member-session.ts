import "server-only";
import { cookies } from "next/headers";
import { ENTRY_COOKIE, entrySignature, isValidEntrySignature } from "./entry-signature";

// 구성원(Member)의 입장 세션. 브라우저를 닫을 때까지 유지되는 쿠키 하나로 판단한다 (ADR-0004).

export async function isMember() {
  return isValidEntrySignature((await cookies()).get(ENTRY_COOKIE)?.value);
}

// 구성원만 쓸 수 있는 API 앞에서 부른다. 구성원이 아니면 돌려줄 401 응답, 구성원이면 null.
export async function memberRequired(): Promise<Response | null> {
  if (await isMember()) return null;
  return Response.json({ error: "비밀번호를 입력해 주세요." }, { status: 401 });
}

export async function startEntrySession() {
  // expires·maxAge를 주지 않아 브라우저를 닫으면 사라지는 세션 쿠키가 된다.
  (await cookies()).set(ENTRY_COOKIE, entrySignature(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function endEntrySession() {
  (await cookies()).delete(ENTRY_COOKIE);
}

// 입장 뒤 돌아갈 주소. 같은 사이트 안의 경로만 허용해 외부 사이트로 보내지 않는다.
// 앞 글자만 보면 "/\t/example.com"처럼 URL 파서가 탭을 지워 "//example.com"이 되는 경우를 놓치므로,
// 브라우저와 같은 규칙으로 파싱한 뒤 출처(origin)가 바뀌지 않았는지 확인한다.
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  const base = "http://same-site.invalid";
  const url = new URL(value, base);
  if (url.origin !== base) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
