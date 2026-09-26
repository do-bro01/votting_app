import { isOperator } from "@/lib/operator";
import { deletePoll, getPoll } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  const { id } = await ctx.params;
  const poll = await getPoll(id);
  if (!poll) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  return Response.json(poll);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  if (!(await isOperator())) {
    return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const result = await deletePoll(id);
  if (result === "poll-not-found") {
    return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
