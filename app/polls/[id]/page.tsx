import Link from "next/link";
import { notFound } from "next/navigation";
import { formatKst } from "@/lib/format";
import { getPoll } from "@/lib/polls";
import { ClosedNotice } from "./closed-notice";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{poll.question}</h1>
        {poll.closesAt && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">마감: {formatKst(poll.closesAt)}</p>
        )}
      </div>
      {poll.isClosed && <ClosedNotice />}
      <VoteForm pollId={poll.id} options={poll.options} closed={poll.isClosed} />
      <Link href={`/polls/${poll.id}/results`} className="text-sm underline underline-offset-4">
        결과 보기
      </Link>
    </div>
  );
}
