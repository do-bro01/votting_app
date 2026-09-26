import { isEntryPassword } from "@/lib/entry-signature";
import { startEntrySession } from "@/lib/member-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || password === "") {
    return Response.json({ error: "비밀번호를 입력해 주세요." }, { status: 400 });
  }
  if (!isEntryPassword(password)) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await startEntrySession();
  return Response.json({ ok: true });
}
