"use client";

export function LogoutButton() {
  async function handleClick() {
    await fetch("/api/logout", { method: "POST" });
    // 입장 중에 미리 불러 둔 화면이 남지 않도록 전체 페이지를 새로 불러온다(login-form과 같은 이유).
    // 입장 상태가 바뀌는 순간이라 일부러 전체 새로고침을 한다(클라이언트 이동은 이전 상태의 화면을 남길 수 있음).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <button type="button" onClick={handleClick} className="text-sm underline underline-offset-4">
      나가기
    </button>
  );
}
