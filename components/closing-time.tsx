import { formatKst } from "@/lib/format";

// 투표의 마감 시각을 한국 시간으로 보여준다. 마감 시각이 없으면 아무것도 그리지 않는다.
export function ClosingTime({ closesAt }: { closesAt: string | null }) {
  if (!closesAt) return null;
  return <p className="text-sm text-zinc-600 dark:text-zinc-400">마감: {formatKst(closesAt)}</p>;
}
