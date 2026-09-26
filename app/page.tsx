import Link from "next/link";
import { connection } from "next/server";
import { formatKst } from "@/lib/format";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  await connection();
  const polls = await listPolls();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">투표 목록</h1>
      {polls.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          아직 투표가 없습니다.{" "}
          <Link href="/new" className="underline underline-offset-4">
            투표 만들기
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {polls.map((poll) => (
            <li
              key={poll.id}
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <div className="flex items-start justify-between gap-3">
                <span data-testid="poll-question" className="font-medium">
                  {poll.question}
                </span>
                {poll.isClosed && (
                  <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    마감됨
                  </span>
                )}
              </div>
              {poll.closesAt && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  마감: {formatKst(poll.closesAt)}
                </span>
              )}
              <div className="flex gap-4 text-sm">
                <Link href={`/polls/${poll.id}`} className="underline underline-offset-4">
                  투표하기
                </Link>
                <Link href={`/polls/${poll.id}/results`} className="underline underline-offset-4">
                  결과 보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
