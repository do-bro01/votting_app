import { NextResponse, type NextRequest } from "next/server";
import { ENTRY_COOKIE, ENTRY_REQUIRED, isValidEntrySignature } from "@/lib/entry-password";

// 앱 전체를 입장 비밀번호로 막는다 (ADR-0004).
// 입장하지 않은 요청은 화면이면 입장 화면으로 보내고, API면 401로 거부한다.
// 투표 화면과 API는 이와 별개로 각자 구성원인지 다시 확인한다.

const PUBLIC_PATHS = new Set(["/login", "/api/login", "/api/logout"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (isValidEntrySignature(request.cookies.get(ENTRY_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: ENTRY_REQUIRED }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // 정적 파일은 막지 않는다. 나머지 모든 화면과 API가 대상이다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
