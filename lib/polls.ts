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

export type PollSummary = {
  id: string;
  question: string;
  createdAt: string;
  closesAt: string | null;
  isClosed: boolean;
};

export type PollOption = { id: string; label: string };

export type Poll = PollSummary & { options: PollOption[] };

function toSummary(row: Record<string, unknown>): PollSummary {
  return {
    id: row.id as string,
    question: row.question as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    closesAt: row.closes_at ? new Date(row.closes_at as string).toISOString() : null,
    isClosed: row.is_closed as boolean,
  };
}

// 마감 여부는 DB 시각(now()) 기준으로 판단한다.
const POLL_COLUMNS = "id, question, created_at, closes_at, (closes_at is not null and closes_at <= now()) as is_closed";

// 투표 하나와 그 선택지(입력 순서)를 함께 읽는다. 없으면 null.
async function findPollWithOptions(id: string) {
  if (!isUuid(id)) return null;
  const sql = db();
  const [polls, options] = await sql.transaction([
    sql.query(`select ${POLL_COLUMNS} from polls where id = $1`, [id]),
    sql`select id, label, vote_count from options where poll_id = ${id} order by position`,
  ]);
  if (!polls[0]) return null;
  return {
    summary: toSummary(polls[0]),
    options: options.map((o) => ({ id: o.id as string, label: o.label as string, votes: o.vote_count as number })),
  };
}

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await db().query(`select ${POLL_COLUMNS} from polls order by created_at desc, id`);
  return rows.map(toSummary);
}

export async function createPoll(input: {
  question: unknown;
  options: unknown;
  closesAt?: unknown;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const result = validatePollInput(input);
  if (!result.ok) return result;

  // 한 문장으로 투표와 선택지를 함께 저장해, 선택지 없는 투표가 남지 않게 한다.
  const rows = await db()`
    with new_poll as (
      insert into polls (question, closes_at)
      values (${result.poll.question}, ${result.poll.closesAt})
      returning id
    )
    insert into options (poll_id, label, position)
    select new_poll.id, o.label, o.position
    from new_poll, unnest(${result.poll.options}::text[]) with ordinality as o(label, position)
    returning poll_id
  `;
  return { ok: true, id: rows[0].poll_id };
}

export async function getPoll(id: string): Promise<Poll | null> {
  const found = await findPollWithOptions(id);
  if (!found) return null;
  return { ...found.summary, options: found.options.map(({ id, label }) => ({ id, label })) };
}

export type PollResults = PollSummary & {
  totalVotes: number;
  options: (PollOption & { votes: number; percent: number })[];
};

export async function getResults(id: string): Promise<PollResults | null> {
  const found = await findPollWithOptions(id);
  if (!found) return null;

  const totalVotes = found.options.reduce((sum, o) => sum + o.votes, 0);
  return {
    ...found.summary,
    totalVotes,
    options: found.options.map((o) => ({
      ...o,
      percent: totalVotes === 0 ? 0 : Math.round((o.votes / totalVotes) * 100),
    })),
  };
}

export type CastVoteResult = "ok" | "poll-not-found" | "option-not-in-poll";

export async function castVote(pollId: string, optionId: unknown): Promise<CastVoteResult> {
  if (!isUuid(pollId)) return "poll-not-found";
  const sql = db();

  if (typeof optionId === "string" && isUuid(optionId)) {
    // 득표수는 DB 안에서 원자적으로 1 올린다. 동시에 던진 표도 사라지지 않는다.
    const updated = await sql`
      update options set vote_count = vote_count + 1
      where id = ${optionId} and poll_id = ${pollId}
      returning id
    `;
    if (updated.length > 0) return "ok";
  }

  const polls = await sql`select 1 from polls where id = ${pollId}`;
  return polls.length === 0 ? "poll-not-found" : "option-not-in-poll";
}
