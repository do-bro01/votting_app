import Link from "next/link";

export default function PollNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">투표를 찾을 수 없습니다</h1>
      <Link href="/" className="underline underline-offset-4">
        목록으로
      </Link>
    </div>
  );
}
