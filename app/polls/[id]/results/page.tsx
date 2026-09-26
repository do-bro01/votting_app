import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/member-session";
import { getResults } from "@/lib/polls";
import { ClosedNotice } from "../closed-notice";
import { ResultsChart } from "./results-chart";

export default async function ResultsPage({ params }: PageProps<"/polls/[id]/results">) {
  await requireMember();
  const { id } = await params;
  const results = await getResults(id);
  if (!results) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{results.question}</h1>
      {results.isClosed && <ClosedNotice />}
      {results.totalVotes === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">아직 표가 없습니다.</p>
      )}
      <ResultsChart options={results.options} />
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
