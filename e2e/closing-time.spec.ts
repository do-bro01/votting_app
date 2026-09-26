import { expect, test } from "@playwright/test";
import { createPollViaApi, hoursFromNow, testQuestion } from "./support";

test.describe("마감 시각 정하기", () => {
  test("폼에서 마감 시각을 넣으면 투표하기 화면과 목록에 한국 시간으로 보인다", async ({ page }) => {
    const question = testQuestion("마감 시각 입력");
    await page.goto("/new");
    await page.getByLabel("질문").fill(question);
    await page.getByLabel("선택지 1", { exact: true }).fill("가");
    await page.getByLabel("선택지 2", { exact: true }).fill("나");
    await page.getByLabel("마감 시각 (선택)").fill("2030-01-15T14:30");
    await page.getByRole("button", { name: "투표 만들기" }).click();

    await expect(page).toHaveURL(/\/polls\/[0-9a-f-]{36}$/);
    await expect(page.getByText("마감: 2030. 1. 15. 오후 2:30")).toBeVisible();
    await expect(page.getByRole("button", { name: "투표하기" })).toBeEnabled();

    await page.goto("/");
    const item = page.getByRole("listitem").filter({ hasText: question });
    await expect(item.getByText("마감: 2030. 1. 15. 오후 2:30")).toBeVisible();
  });

  test("마감 시각 없이 만든 투표는 마감 표시가 없다", async ({ page, request }) => {
    const question = testQuestion("기한 미정");
    const id = await createPollViaApi(request, question, ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await expect(page.getByText(/^마감/)).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByRole("listitem").filter({ hasText: question }).getByText(/마감/)).toHaveCount(0);
  });

  test("과거 마감 시각은 폼에서 거부된다", async ({ page }) => {
    await page.goto("/new");
    await page.getByLabel("질문").fill(testQuestion("과거 마감"));
    await page.getByLabel("선택지 1", { exact: true }).fill("가");
    await page.getByLabel("선택지 2", { exact: true }).fill("나");
    await page.getByLabel("마감 시각 (선택)").fill("2020-01-01T09:00");
    await page.getByRole("button", { name: "투표 만들기" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("마감 시각은 지금 이후여야 합니다.");
    await expect(page).toHaveURL(/\/new$/);
  });

  test("API: 과거·형식 오류 마감 시각은 400", async ({ request }) => {
    for (const closesAt of [
      "2020-01-01T00:00:00Z",
      "not-a-date",
      123,
      "2030-02-31T00:00:00Z", // 없는 날짜
      "2030-01-15T14:30", // 시간대 없음
    ]) {
      const res = await request.post("/api/polls", {
        data: { question: testQuestion("API 마감 검증"), options: ["가", "나"], closesAt },
      });
      expect(res.status(), String(closesAt)).toBe(400);
    }
  });

  test("API: 조회 결과에 closesAt과 isClosed가 있다", async ({ request }) => {
    const closesAt = hoursFromNow(24);
    const withDeadline = await createPollViaApi(request, testQuestion("API 마감 조회"), ["가", "나"], closesAt);
    const without = await createPollViaApi(request, testQuestion("API 마감 없음"), ["가", "나"]);

    const a = await (await request.get(`/api/polls/${withDeadline}`)).json();
    expect(a.closesAt).toBe(closesAt);
    expect(a.isClosed).toBe(false);

    const b = await (await request.get(`/api/polls/${without}`)).json();
    expect(b.closesAt).toBeNull();
    expect(b.isClosed).toBe(false);
  });
});

test.describe("다른 시간대의 브라우저", () => {
  test.use({ timezoneId: "America/New_York" });

  test("현지 시각으로 넣은 마감 시각이 한국 시간으로 바뀌어 보인다", async ({ page }) => {
    await page.goto("/new");
    await page.getByLabel("질문").fill(testQuestion("뉴욕에서 만든 투표"));
    await page.getByLabel("선택지 1", { exact: true }).fill("가");
    await page.getByLabel("선택지 2", { exact: true }).fill("나");
    // 뉴욕 2030-01-15 14:30(UTC-5) = 한국 2030-01-16 04:30
    await page.getByLabel("마감 시각 (선택)").fill("2030-01-15T14:30");
    await page.getByRole("button", { name: "투표 만들기" }).click();

    await expect(page).toHaveURL(/\/polls\/[0-9a-f-]{36}$/);
    await expect(page.getByText("마감: 2030. 1. 16. 오전 4:30")).toBeVisible();
  });
});
