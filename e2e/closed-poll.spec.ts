import { expect, test } from "@playwright/test";
import { closePoll, createPollViaApi, hoursFromNow, testQuestion } from "./support";

test.describe("마감된 투표", () => {
  test("투표하기 화면은 안내 문구와 함께 선택지·버튼이 비활성화되고 결과 보기는 남는다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("마감 화면"), ["가", "나"], hoursFromNow(1));
    await closePoll(id);

    await page.goto(`/polls/${id}`);
    await expect(page.getByText("마감된 투표입니다")).toBeVisible();
    await expect(page.getByRole("radio", { name: "가" })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "나" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "투표하기" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "결과 보기" })).toBeVisible();
  });

  test("API로 표를 던지면 409이고 득표수가 늘지 않는다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("마감 API"), ["가", "나"], hoursFromNow(1));
    const poll = await (await request.get(`/api/polls/${id}`)).json();
    await closePoll(id);

    const res = await request.post(`/api/polls/${id}/vote`, { data: { optionId: poll.options[0].id } });
    expect(res.status()).toBe(409);
    expect((await res.json()).error).toBe("마감된 투표입니다.");

    const after = await (await request.get(`/api/polls/${id}`)).json();
    expect(after.isClosed).toBe(true);
    await page.goto(`/polls/${id}/results`);
    await expect(page.getByTestId("total-votes")).toHaveText("전체 0표");
  });

  test("화면을 연 뒤 마감되어 제출이 거부되면 안내가 보인다", async ({ page, request }) => {
    const id = await createPollViaApi(request, testQuestion("열어 둔 사이 마감"), ["가", "나"], hoursFromNow(1));

    await page.goto(`/polls/${id}`);
    await page.getByRole("radio", { name: "가" }).check();
    await closePoll(id);
    await page.getByRole("button", { name: "투표하기" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("마감된 투표입니다.");
    await expect(page).toHaveURL(new RegExp(`/polls/${id}$`));
    await expect(page.getByRole("button", { name: "투표하기" })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "가" })).toBeDisabled();
  });

  test("목록에는 '마감됨', 결과 화면에는 '마감된 투표입니다'가 보인다", async ({ page, request }) => {
    const question = testQuestion("마감 표시");
    const id = await createPollViaApi(request, question, ["가", "나"], hoursFromNow(1));
    await closePoll(id);

    await page.goto("/");
    await expect(page.getByRole("listitem").filter({ hasText: question }).getByText("마감됨")).toBeVisible();

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByText("마감된 투표입니다")).toBeVisible();
  });

  test("마감 전 투표는 목록에 '마감됨'이 없고 정상적으로 표를 받는다", async ({ page, request }) => {
    const question = testQuestion("마감 전");
    const id = await createPollViaApi(request, question, ["가", "나"], hoursFromNow(1));

    await page.goto("/");
    await expect(page.getByRole("listitem").filter({ hasText: question }).getByText("마감됨")).toHaveCount(0);

    await page.goto(`/polls/${id}`);
    await page.getByRole("radio", { name: "나" }).check();
    await page.getByRole("button", { name: "투표하기" }).click();
    await expect(page.getByTestId("total-votes")).toHaveText("전체 1표");
  });
});
