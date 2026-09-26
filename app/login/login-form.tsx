"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ returnPath }: { returnPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === "") {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "입장하지 못했습니다.");
      setSubmitting(false);
      return;
    }
    // 상단 메뉴(서버에서 그림)가 입장한 상태로 바뀌도록 이동 후 새로 그린다.
    router.replace(returnPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-medium">입장 비밀번호</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-black/20 px-3 py-2 dark:border-white/25 dark:bg-zinc-900"
        />
      </label>

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
        입장
      </button>
    </form>
  );
}
