import "server-only";
import { neon } from "@neondatabase/serverless";
import { validatePollInput } from "./poll-rules";

// 투표(Poll) 데이터 모듈. 모든 SQL은 이 파일에만 있다 (ADR-0002: ORM 없이 raw SQL).

function db() {
  return neon(process.env.DATABASE_URL!);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID.test(value);
}

export type PollSummary = { id: string; question: string; createdAt: string };

export type Poll = PollSummary & { options: { id: string; label: string }[] };

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await db()`
    select id, question, created_at from polls order by created_at desc, id
  `;
  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function createPoll(input: {
  question: unknown;
  options: unknown;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const result = validatePollInput(input);
  if (!result.ok) return result;

  // 한 문장으로 투표와 선택지를 함께 저장해, 선택지 없는 투표가 남지 않게 한다.
  const rows = await db()`
    with new_poll as (
      insert into polls (question) values (${result.poll.question}) returning id
    )
    insert into options (poll_id, label, position)
    select new_poll.id, o.label, o.position
    from new_poll, unnest(${result.poll.options}::text[]) with ordinality as o(label, position)
    returning poll_id
  `;
  return { ok: true, id: rows[0].poll_id };
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;
  const sql = db();
  const [polls, options] = await sql.transaction([
    sql`select id, question, created_at from polls where id = ${id}`,
    sql`select id, label from options where poll_id = ${id} order by position`,
  ]);
  const poll = polls[0];
  if (!poll) return null;
  return {
    id: poll.id,
    question: poll.question,
    createdAt: new Date(poll.created_at).toISOString(),
    options: options.map((o) => ({ id: o.id, label: o.label })),
  };
}
