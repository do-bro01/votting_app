import { isOperator } from "@/lib/operator";
import { createPoll } from "@/lib/polls";

export async function POST(request: Request) {
  if (!(await isOperator())) {
    return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const result = await createPoll({
    question: body.question,
    options: body.options,
    closesAt: body.closesAt,
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ id: result.id }, { status: 201 });
}
