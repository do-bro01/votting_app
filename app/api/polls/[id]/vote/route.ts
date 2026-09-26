import { memberRequired } from "@/lib/member-session";
import { castVote } from "@/lib/polls";

export async function POST(request: Request, ctx: RouteContext<"/api/polls/[id]/vote">) {
  const denied = await memberRequired();
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  const result = await castVote(id, body?.optionId);
  if (result === "poll-not-found") {
    return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "poll-closed") {
    return Response.json({ error: "마감된 투표입니다." }, { status: 409 });
  }
  if (result === "option-not-in-poll") {
    return Response.json({ error: "이 투표의 선택지가 아닙니다." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
