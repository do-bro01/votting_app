import { neon } from "@neondatabase/serverless";
import type { APIRequestContext } from "@playwright/test";

// 테스트가 만든 투표는 모두 이 접두어로 시작한다. 끝나면 global-teardown이 지운다.
export const TEST_PREFIX = "[e2e]";

export function testQuestion(name: string) {
  return `${TEST_PREFIX} ${name} ${crypto.randomUUID().slice(0, 8)}`;
}

export function db() {
  return neon(process.env.DATABASE_URL!);
}

export async function createPollViaApi(
  request: APIRequestContext,
  question: string,
  options: string[],
  closesAt?: string,
): Promise<string> {
  const res = await request.post("/api/polls", { data: { question, options, closesAt } });
  if (res.status() !== 201) {
    throw new Error(`투표 만들기 실패: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()).id;
}

// 앱은 과거 마감 시각을 거부하므로, 마감된 투표는 DB에서 마감 시각을 과거로 바꿔 만든다.
export async function closePoll(pollId: string) {
  await db()`update polls set closes_at = now() - interval '1 minute' where id = ${pollId}`;
}

export function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}
