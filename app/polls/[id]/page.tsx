import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoll } from "@/lib/polls";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{poll.question}</h1>
      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => (
          <li key={option.id} className="rounded-md border border-black/10 px-4 py-3 dark:border-white/15">
            <span data-testid="option-label">{option.label}</span>
          </li>
        ))}
      </ul>
      <Link href={`/polls/${poll.id}/results`} className="text-sm underline underline-offset-4">
        결과 보기
      </Link>
    </div>
  );
}
