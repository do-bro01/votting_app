import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosingTime } from "@/components/closing-time";
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
        <ClosingTime closesAt={poll.closesAt} />
      </div>
      {poll.isClosed && <ClosedNotice />}
      <VoteForm pollId={poll.id} options={poll.options} isClosed={poll.isClosed} />
      <Link href={`/polls/${poll.id}/results`} className="text-sm underline underline-offset-4">
        결과 보기
      </Link>
    </div>
  );
}
