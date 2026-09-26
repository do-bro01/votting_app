"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PollOption } from "@/lib/polls";

type Props = {
  pollId: string;
  options: PollOption[];
};

export function VoteForm({ pollId, options }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("선택지를 하나 골라 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: selected }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "표를 던지지 못했습니다.");
      setSubmitting(false);
      return;
    }
    router.push(`/polls/${pollId}/results`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">선택지</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-black/10 px-4 py-3 has-[:checked]:border-foreground dark:border-white/15"
          >
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
            />
            <span data-testid="option-label">{option.label}</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
      >
        투표하기
      </button>
    </form>
  );
}
