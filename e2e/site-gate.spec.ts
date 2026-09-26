import { expect, test, type Browser, type Page } from "@playwright/test";
import { ANONYMOUS, createPollViaApi, db, testQuestion } from "./support";

// 투표는 구성원(기본 저장 상태)의 request로 만들고, 입장하지 않은 브라우저에서 확인한다.
async function anonymousPage(browser: Browser) {
  const context = await browser.newContext({ storageState: ANONYMOUS });
  return { context, page: await context.newPage() };
}

async function enter(page: Page) {
  await page.getByLabel("입장 비밀번호").fill(process.env.ADMIN_TOKEN!);
  await page.getByRole("button", { name: "입장" }).click();
}

test.describe("입장하지 않은 사람", () => {
  test("어느 화면으로 들어와도 입장 화면으로 가고 투표 내용은 보이지 않는다", async ({ browser, request }) => {
    const question = testQuestion("입장 전 차단");
    const id = await createPollViaApi(request, question, ["가", "나"]);
    const { context, page } = await anonymousPage(browser);

    for (const path of ["/", "/new", `/polls/${id}`, `/polls/${id}/results`]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
      await expect(page.getByRole("heading", { name: "투표 앱" })).toBeVisible();
      await expect(page.getByText(question)).toHaveCount(0);
      await expect(page.getByTestId("poll-question")).toHaveCount(0);
    }
    await context.close();
  });

  test("입장 화면 상단에는 메뉴가 없고 하단에는 이름이 있다", async ({ browser }) => {
    const { context, page } = await anonymousPage(browser);
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "투표 만들기" })).toHaveCount(0);
    await expect(header.getByRole("button", { name: "나가기" })).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveText("김도형");
    await context.close();
  });

  test("공유받은 주소로 들어와 입장하면 그 화면(검색 파라미터 포함)으로 돌아간다", async ({ browser, request }) => {
    const question = testQuestion("공유 링크");
    const id = await createPollViaApi(request, question, ["가", "나"]);
    const { context, page } = await anonymousPage(browser);

    await page.goto(`/polls/${id}?from=kakao`);
    await enter(page);
    await expect(page).toHaveURL(new RegExp(`/polls/${id}\\?from=kakao$`));
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    await context.close();
  });

  test("모든 투표 API는 401이고 아무것도 바뀌지 않는다", async ({ browser, request }) => {
    const id = await createPollViaApi(request, testQuestion("입장 전 API"), ["가", "나"]);
    const poll = await (await request.get(`/api/polls/${id}`)).json();
    const { context } = await anonymousPage(browser);
    const anon = context.request;

    expect((await anon.get(`/api/polls/${id}`)).status()).toBe(401);

    const newQuestion = testQuestion("입장 전 만들기");
    const created = await anon.post("/api/polls", { data: { question: newQuestion, options: ["가", "나"] } });
    expect(created.status()).toBe(401);
    expect((await created.json()).error).toBe("비밀번호를 입력해 주세요.");
    expect(await db()`select 1 from polls where question = ${newQuestion}`).toHaveLength(0);

    const voted = await anon.post(`/api/polls/${id}/vote`, { data: { optionId: poll.options[0].id } });
    expect(voted.status()).toBe(401);

    expect((await anon.delete(`/api/polls/${id}`)).status()).toBe(401);
    expect(await db()`select 1 from polls where id = ${id}`).toHaveLength(1);

    const after = await db()`select sum(vote_count)::int as total from options where poll_id = ${id}`;
    expect(after[0].total).toBe(0);
    await context.close();
  });

  test("입장 API는 입장하지 않아도 부를 수 있다", async ({ browser }) => {
    const { context } = await anonymousPage(browser);
    const res = await context.request.post("/api/login", { data: { password: process.env.ADMIN_TOKEN } });
    expect(res.status()).toBe(200);
    await context.close();
  });
});

test.describe("구성원", () => {
  test("'나가기'를 누르면 입장 화면으로 가고, 뒤로 가기나 주소 입력으로 돌아가도 입장 화면이 나온다", async ({ browser, request }) => {
    const question = testQuestion("나간 뒤 뒤로 가기");
    const id = await createPollViaApi(request, question, ["가", "나"]);
    const { context, page } = await anonymousPage(browser);
    await page.goto(`/polls/${id}`);
    await enter(page);
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
    await page.getByRole("link", { name: "투표 앱" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("banner").getByRole("button", { name: "나가기" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2F$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(question)).toHaveCount(0);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?next=%2F$/);
    await context.close();
  });
});
