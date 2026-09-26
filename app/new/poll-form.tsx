"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_OPTIONS, MIN_OPTIONS, validatePollInput } from "@/lib/poll-rules";

export function PollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(Array(MIN_OPTIONS).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = validatePollInput({ question, options });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checked.poll),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "투표를 만들지 못했습니다.");
      setSubmitting(false);
      return;
    }
    router.push(`/polls/${body.id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-medium">질문</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-md border border-black/20 px-3 py-2 dark:border-white/25 dark:bg-zinc-900"
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`선택지 ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="flex-1 rounded-md border border-black/20 px-3 py-2 dark:border-white/25 dark:bg-zinc-900"
            />
            <button
              type="button"
              aria-label={`선택지 ${index + 1} 삭제`}
              disabled={options.length <= MIN_OPTIONS}
              onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
              className="rounded-md border border-black/20 px-3 text-sm disabled:opacity-40 dark:border-white/25"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={options.length >= MAX_OPTIONS}
          onClick={() => setOptions((prev) => [...prev, ""])}
          className="self-start rounded-md border border-black/20 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/25"
        >
          선택지 추가
        </button>
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
        투표 만들기
      </button>
    </form>
  );
}
