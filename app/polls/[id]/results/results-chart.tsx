import type { PollResults } from "@/lib/polls";

// 선택지별 퍼센트 가로 막대 그래프. 막대는 장식이고 정보는 텍스트로 전달한다.
export function ResultsChart({ options }: { options: PollResults["options"] }) {
  return (
    <ul className="flex flex-col gap-4">
      {options.map((option) => (
        <li key={option.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span data-testid="result-label" className="font-medium">
              {option.label}
            </span>
            <span className="flex gap-3 tabular-nums text-sm">
              <span data-testid="result-votes" className="text-zinc-600 dark:text-zinc-400">
                {option.votes}표
              </span>
              <span data-testid="result-percent" className="w-12 text-right font-semibold">
                {option.percent}%
              </span>
            </span>
          </div>
          <div
            data-testid="result-track"
            aria-hidden="true"
            className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              data-testid="result-bar"
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
              style={{ width: `${option.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
