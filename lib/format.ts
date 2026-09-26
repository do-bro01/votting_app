const KST = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

// 마감 시각(ISO)을 한국 시간으로 표시한다. 예: "2030. 1. 15. 오후 2:30"
export function formatKst(iso: string) {
  return KST.format(new Date(iso));
}
