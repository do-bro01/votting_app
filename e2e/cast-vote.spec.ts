import { expect, test, type APIRequestContext } from "@playwright/test";
import { createPoll, testQuestion } from "./support";

async function optionIds(request: APIRequestContext, pollId: string): Promise<string[]> {
  const poll = await (await request.get(`/api/polls/${pollId}`)).json();
  return poll.options.map((o: { id: string }) => o.id);
}

test.describe("표 던지기", () => {
  test("선택지 하나를 골라 제출하면 결과 화면으로 이동하고 표가 반영된다", async ({ page, request }) => {
    const id = await createPoll(request, testQuestion("표 던지기"), ["치킨", "피자"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("radio", { name: "피자" }).check();
    await page.getByRole("button", { name: "투표하기" }).click();

    await expect(page).toHaveURL(new RegExp(`/polls/${id}/results$`));
    await expect(page.getByTestId("result-votes")).toHaveText(["0표", "1표"]);
    await expect(page.getByTestId("result-percent")).toHaveText(["0%", "100%"]);
  });

  test("선택지는 하나만 고를 수 있다", async ({ page, request }) => {
    const id = await createPoll(request, testQuestion("단일 선택"), ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("radio", { name: "가" }).check();
    await page.getByRole("radio", { name: "나" }).check();
    await expect(page.getByRole("radio", { name: "가" })).not.toBeChecked();
    await expect(page.getByRole("radio", { name: "나" })).toBeChecked();
  });

  test("아무것도 고르지 않고 제출하면 안내 문구가 나온다", async ({ page, request }) => {
    const id = await createPoll(request, testQuestion("미선택 제출"), ["가", "나"]);

    await page.goto(`/polls/${id}`);
    await page.getByRole("button", { name: "투표하기" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("선택지를 하나 골라 주세요.");
    await expect(page).toHaveURL(new RegExp(`/polls/${id}$`));
  });
});

test.describe("표 던지기 API", () => {
  test("다른 투표의 선택지, 없는 선택지, 형식이 잘못된 요청은 400", async ({ request }) => {
    const id = await createPoll(request, testQuestion("API 선택지 검증"), ["가", "나"]);
    const otherId = await createPoll(request, testQuestion("API 다른 투표"), ["다", "라"]);
    const [otherOption] = await optionIds(request, otherId);

    const cases = [
      { optionId: otherOption },
      { optionId: crypto.randomUUID() },
      { optionId: "not-a-uuid" },
      { optionId: 1 },
      {},
    ];
    for (const data of cases) {
      const res = await request.post(`/api/polls/${id}/vote`, { data });
      expect(res.status(), JSON.stringify(data)).toBe(400);
    }

    const results = await (await request.get(`/api/polls/${otherId}`)).json();
    expect(results.options).toHaveLength(2);
  });

  test("없는 투표에 표를 던지면 404", async ({ request }) => {
    const optionId = crypto.randomUUID();
    expect((await request.post(`/api/polls/${crypto.randomUUID()}/vote`, { data: { optionId } })).status()).toBe(404);
    expect((await request.post("/api/polls/not-a-uuid/vote", { data: { optionId } })).status()).toBe(404);
  });

  test("동시에 던진 표가 하나도 사라지지 않는다", async ({ page, request }) => {
    const id = await createPoll(request, testQuestion("동시 투표"), ["가", "나"]);
    const [first] = await optionIds(request, id);

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request.post(`/api/polls/${id}/vote`, { data: { optionId: first } })),
    );
    expect(responses.map((r) => r.status())).toEqual(Array(10).fill(200));

    await page.goto(`/polls/${id}/results`);
    await expect(page.getByTestId("result-votes")).toHaveText(["10표", "0표"]);
    await expect(page.getByTestId("total-votes")).toHaveText("전체 10표");
  });
});
