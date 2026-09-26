import Link from "next/link";
import { notFound } from "next/navigation";
import { getResults } from "@/lib/polls";

export default async function ResultsPage({ params }: PageProps<"/polls/[id]/results">) {
  const { id } = await params;
  const results = await getResults(id);
  if (!results) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{results.question}</h1>
      {results.totalVotes === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">아직 투표가 없습니다.</p>
      )}
      <ul className="flex flex-col gap-2">
        {results.options.map((option) => (
          <li
            key={option.id}
            className="flex items-center justify-between gap-4 rounded-md border border-black/10 px-4 py-3 dark:border-white/15"
          >
            <span data-testid="result-label">{option.label}</span>
            <span className="flex gap-3 tabular-nums">
              <span data-testid="result-votes">{option.votes}표</span>
              <span data-testid="result-percent" className="w-12 text-right font-medium">
                {option.percent}%
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p data-testid="total-votes" className="text-sm text-zinc-600 dark:text-zinc-400">
        전체 {results.totalVotes}표
      </p>
      <div className="flex gap-4 text-sm">
        <Link href={`/polls/${results.id}`} className="underline underline-offset-4">
          투표하러 가기
        </Link>
        <Link href="/" className="underline underline-offset-4">
          목록으로
        </Link>
      </div>
    </div>
  );
}
