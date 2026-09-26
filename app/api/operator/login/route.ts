import { isOperatorPassword, startOperatorSession } from "@/lib/operator";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || password === "") {
    return Response.json({ error: "비밀번호를 입력해 주세요." }, { status: 400 });
  }
  if (!isOperatorPassword(password)) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await startOperatorSession();
  return Response.json({ ok: true });
}
