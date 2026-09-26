import { endOperatorSession } from "@/lib/operator";

export async function POST() {
  await endOperatorSession();
  return Response.json({ ok: true });
}
