import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoll } from "@/lib/polls";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{poll.question}</h1>
      <VoteForm pollId={poll.id} options={poll.options} />
      <Link href={`/polls/${poll.id}/results`} className="text-sm underline underline-offset-4">
        결과 보기
      </Link>
    </div>
  );
}
