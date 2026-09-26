"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 구성원에게만 보인다. 바로 지우지 않고 확인 단계를 거친다.
export function DeletePollButton({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/polls/${pollId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "투표를 삭제하지 못했습니다.");
      setDeleting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start rounded-md border border-red-600/40 px-3 py-1.5 text-sm text-red-700 dark:text-red-400"
      >
        투표 삭제
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-red-600/40 p-4">
      <p className="text-sm">이 투표를 삭제할까요? 선택지와 표도 모두 사라집니다.</p>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          삭제
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm dark:border-white/25"
        >
          취소
        </button>
      </div>
    </div>
  );
}
