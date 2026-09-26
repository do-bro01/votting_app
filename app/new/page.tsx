import { requireMember } from "@/lib/member-session";
import { PollForm } from "./poll-form";

export default async function NewPollPage() {
  await requireMember();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">투표 만들기</h1>
      <PollForm />
    </div>
  );
}
