import { expect, test } from "@playwright/test";
import { closePoll, createPollViaApi, db, hoursFromNow, testQuestion } from "./support";

test.describe("구성원의 투표 삭제", () => {
  test("확인 단계에서 '취소'하면 아무것도 지워지지 않는다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("삭제 취소"), ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("button", { name: "투표 삭제" }).click();
    await expect(page.getByText("이 투표를 삭제할까요? 선택지와 표도 모두 사라집니다.")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();

    await expect(page.getByText("이 투표를 삭제할까요?")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "투표 삭제" })).toBeVisible();
    expect((await request.get(`/api/polls/${id}`)).status()).toBe(200);
  });

  test("'삭제'하면 선택지까지 지워지고 목록으로 가며, 목록과 주소에서 사라진다", async ({ page, request }) => {
    const question = testQuestion("삭제 확인");
    const id = await createPollViaApi(request, question, ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("button", { name: "투표 삭제" }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("poll-question").filter({ hasText: question })).toHaveCount(0);

    await page.goto(`/polls/${id}`);
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
    await page.goto(`/polls/${id}/results`);
    await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();

    const options = await db()`select 1 from options where poll_id = ${id}`;
    expect(options).toHaveLength(0);
  });

  test("마감된 투표도 삭제할 수 있다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("마감 후 삭제"), ["가", "나"], hoursFromNow(1));
    await closePoll(id);

    await page.goto(`/polls/${id}`);
    await page.getByRole("button", { name: "투표 삭제" }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await request.get(`/api/polls/${id}`)).status()).toBe(404);
  });

  test("API: 없는 투표와 uuid가 아닌 id는 404", async ({ request }) => {
    expect((await request.delete(`/api/polls/${crypto.randomUUID()}`)).status()).toBe(404);
    expect((await request.delete("/api/polls/not-a-uuid")).status()).toBe(404);
  });
});
