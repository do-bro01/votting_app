import { expect, test } from "@playwright/test";
import { ANONYMOUS, createPollViaApi, db, testQuestion } from "./support";

test.describe("로그인하지 않은 사람", () => {
  test.use({ storageState: ANONYMOUS });

  test("투표 만들기 화면에 들어가면 로그인 화면으로 가고, 로그인하면 돌아온다", async ({ page }) => {
    await page.goto("/new");
    await expect(page).toHaveURL(/\/login\?next=%2Fnew$/);

    await page.getByLabel("운영자 비밀번호").fill(process.env.ADMIN_TOKEN!);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/new$/);
    await expect(page.getByRole("heading", { name: "투표 만들기" })).toBeVisible();
  });

  test("투표 만들기 API는 401이고 아무것도 저장되지 않는다", async ({ request }) => {
    const question = testQuestion("비로그인 API 만들기");
    const res = await request.post("/api/polls", { data: { question, options: ["가", "나"] } });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe("운영자 로그인이 필요합니다.");

    const rows = await db()`select 1 from polls where question = ${question}`;
    expect(rows).toHaveLength(0);
  });
});

test("로그인하지 않은 투표자도 표를 던지고 결과를 볼 수 있다", async ({ browser, request }) => {
  // 투표는 운영자(기본 저장 상태)로 만들고, 투표는 빈 브라우저에서 한다.
  const id = await createPollViaApi(request, testQuestion("비로그인 투표"), ["가", "나"]);

  const context = await browser.newContext({ storageState: ANONYMOUS });
  const page = await context.newPage();
  await page.goto(`/polls/${id}`);
  await expect(page.getByRole("banner").getByRole("link", { name: "운영자 로그인" })).toBeVisible();
  await page.getByRole("radio", { name: "나" }).check();
  await page.getByRole("button", { name: "투표하기" }).click();

  await expect(page).toHaveURL(new RegExp(`/polls/${id}/results$`));
  await expect(page.getByTestId("result-votes")).toHaveText(["0표", "1표"]);
  await context.close();
});
