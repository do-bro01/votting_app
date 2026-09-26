import { expect, test } from "@playwright/test";
import { createPollViaApi, testQuestion } from "./support";

test.describe("투표 만들기", () => {
  test("질문과 선택지로 투표를 만들면 투표하기 화면에서 입력 순서대로 보인다", async ({ page }) => {
    const question = testQuestion("점심 메뉴");
    await page.goto("/new");
    await page.getByLabel("질문").fill(question);
    await page.getByLabel("선택지 1", { exact: true }).fill("치킨");
    await page.getByLabel("선택지 2", { exact: true }).fill("피자");
    await page.getByRole("button", { name: "선택지 추가" }).click();
    await page.getByLabel("선택지 3", { exact: true }).fill("짜장면");
    await page.getByRole("button", { name: "투표 만들기" }).click();

    await expect(page).toHaveURL(/\/polls\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    await expect(page.getByTestId("option-label")).toHaveText(["치킨", "피자", "짜장면"]);
  });

  test("선택지 입력칸은 처음 2개, 최대 5개이며 2개 미만으로 줄일 수 없다", async ({ page }) => {
    await page.goto("/new");
    const add = page.getByRole("button", { name: "선택지 추가" });
    const inputs = page.getByRole("textbox", { name: /^선택지 \d$/ });

    await expect(inputs).toHaveCount(2);
    await expect(page.getByRole("button", { name: /선택지 \d 삭제/ }).first()).toBeDisabled();

    await add.click();
    await add.click();
    await add.click();
    await expect(inputs).toHaveCount(5);
    await expect(add).toBeDisabled();

    await page.getByRole("button", { name: "선택지 5 삭제" }).click();
    await expect(inputs).toHaveCount(4);
    await expect(add).toBeEnabled();
  });

  test("빈 질문, 빈 선택지, 중복 선택지는 폼에서 이유와 함께 거부된다", async ({ page }) => {
    await page.goto("/new");
    const submit = page.getByRole("button", { name: "투표 만들기" });
    const alert = page.locator("form").getByRole("alert");

    await page.getByLabel("선택지 1", { exact: true }).fill("치킨");
    await page.getByLabel("선택지 2", { exact: true }).fill("피자");
    await page.getByLabel("질문").fill("   ");
    await submit.click();
    await expect(alert).toHaveText("질문을 입력해 주세요.");

    await page.getByLabel("질문").fill(testQuestion("폼 검증"));
    await page.getByLabel("선택지 2", { exact: true }).fill("  ");
    await submit.click();
    await expect(alert).toHaveText("빈 선택지가 있습니다.");

    await page.getByLabel("선택지 2", { exact: true }).fill(" 치킨 ");
    await submit.click();
    await expect(alert).toHaveText("같은 선택지가 중복되었습니다.");
    await expect(page).toHaveURL(/\/new$/);
  });

  test("새 투표는 목록에 보이고 투표하기·결과 보기 링크가 있다", async ({ page, request }) => {
    const question = testQuestion("목록 확인");
    const id = await createPollViaApi(request, question, ["가", "나"]);

    await page.goto("/");
    const item = page.getByRole("listitem").filter({ hasText: question });
    await expect(item).toBeVisible();
    await expect(item.getByRole("link", { name: "투표하기" })).toHaveAttribute("href", `/polls/${id}`);
    await expect(item.getByRole("link", { name: "결과 보기" })).toHaveAttribute(
      "href",
      `/polls/${id}/results`,
    );
  });

  test("목록은 최신순이다", async ({ page, request }) => {
    const older = testQuestion("먼저 만든 투표");
    const newer = testQuestion("나중에 만든 투표");
    await createPollViaApi(request, older, ["가", "나"]);
    await createPollViaApi(request, newer, ["가", "나"]);

    await page.goto("/");
    const questions = await page.getByTestId("poll-question").allTextContents();
    expect(questions.indexOf(newer)).toBeGreaterThanOrEqual(0);
    expect(questions.indexOf(newer)).toBeLessThan(questions.indexOf(older));
  });

  test("첫 화면에서 투표 만들기로 이동할 수 있다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "투표 만들기" }).first().click();
    await expect(page).toHaveURL(/\/new$/);
  });
});

test.describe("투표 만들기 API", () => {
  const invalidBodies: [string, unknown][] = [
    ["빈 질문", { question: "  ", options: ["가", "나"] }],
    ["빈 선택지", { question: "질문", options: ["가", " "] }],
    ["중복 선택지(공백 제거 후)", { question: "질문", options: ["가", " 가 "] }],
    ["선택지 1개", { question: "질문", options: ["가"] }],
    ["선택지 6개", { question: "질문", options: ["1", "2", "3", "4", "5", "6"] }],
    ["선택지가 배열이 아님", { question: "질문", options: "가,나" }],
    ["질문이 문자열이 아님", { question: 1, options: ["가", "나"] }],
  ];

  for (const [name, data] of invalidBodies) {
    test(`${name}: 400으로 거부된다`, async ({ request }) => {
      const res = await request.post("/api/polls", { data });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toEqual(expect.any(String));
    });
  }

  test("저장값은 앞뒤 공백이 제거되고 선택지는 입력 순서대로 조회된다", async ({ request }) => {
    const question = testQuestion("공백 제거");
    const id = await createPollViaApi(request, `  ${question}  `, [" 다 ", "가", " 나"]);

    const res = await request.get(`/api/polls/${id}`);
    expect(res.status()).toBe(200);
    const poll = await res.json();
    expect(poll.question).toBe(question);
    expect(poll.options.map((o: { label: string }) => o.label)).toEqual(["다", "가", "나"]);
  });

  test("없는 투표와 uuid가 아닌 id는 404", async ({ request }) => {
    expect((await request.get(`/api/polls/${crypto.randomUUID()}`)).status()).toBe(404);
    expect((await request.get("/api/polls/not-a-uuid")).status()).toBe(404);
  });
});

test("없는 투표의 투표하기 화면은 '투표를 찾을 수 없습니다'", async ({ page }) => {
  await page.goto(`/polls/${crypto.randomUUID()}`);
  await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
  await page.goto("/polls/not-a-uuid");
  await expect(page.getByText("투표를 찾을 수 없습니다")).toBeVisible();
});
