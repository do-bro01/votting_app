import { endEntrySession } from "@/lib/member-session";

export async function POST() {
  await endEntrySession();
  return Response.json({ ok: true });
}
