// 투표(Poll) 입력 규칙. 서버가 기준이고, 폼도 같은 규칙으로 미리 안내한다.
// DB에 의존하지 않으므로 클라이언트 컴포넌트에서도 가져다 쓸 수 있다.

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;

export type NewPoll = { question: string; options: string[] };

export type PollInputResult = { ok: true; poll: NewPoll } | { ok: false; error: string };

export function validatePollInput(input: { question: unknown; options: unknown }): PollInputResult {
  const { question, options } = input;
  if (typeof question !== "string" || !Array.isArray(options)) {
    return { ok: false, error: "질문과 선택지 형식이 올바르지 않습니다." };
  }
  if (!options.every((o): o is string => typeof o === "string")) {
    return { ok: false, error: "질문과 선택지 형식이 올바르지 않습니다." };
  }

  const trimmedQuestion = question.trim();
  const trimmedOptions = options.map((o) => o.trim());

  if (trimmedQuestion === "") return { ok: false, error: "질문을 입력해 주세요." };
  if (trimmedOptions.length < MIN_OPTIONS || trimmedOptions.length > MAX_OPTIONS) {
    return { ok: false, error: `선택지는 ${MIN_OPTIONS}개 이상 ${MAX_OPTIONS}개 이하로 입력해 주세요.` };
  }
  if (trimmedOptions.some((o) => o === "")) return { ok: false, error: "빈 선택지가 있습니다." };
  if (new Set(trimmedOptions).size !== trimmedOptions.length) {
    return { ok: false, error: "같은 선택지가 중복되었습니다." };
  }

  return { ok: true, poll: { question: trimmedQuestion, options: trimmedOptions } };
}
