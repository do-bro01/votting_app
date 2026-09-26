"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} className="text-sm underline underline-offset-4">
      나가기
    </button>
  );
}
