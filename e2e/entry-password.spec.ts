import { expect, test, type Page } from "@playwright/test";
import { ANONYMOUS } from "./support";

test.use({ storageState: ANONYMOUS });

const PASSWORD = process.env.ADMIN_TOKEN!;

async function login(page: Page, password: string) {
  await page.getByLabel("입장 비밀번호").fill(password);
  await page.getByRole("button", { name: "입장" }).click();
}

async function expectLoggedOutHeader(page: Page) {
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "투표 만들기" })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "나가기" })).toHaveCount(0);
}

async function expectMemberHeader(page: Page) {
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "투표 만들기" })).toBeVisible();
  await expect(header.getByRole("button", { name: "나가기" })).toBeVisible();
  await expect(header.getByRole("link", { name: "입장" })).toHaveCount(0);
}

test.describe("입장 비밀번호", () => {
  test("비밀번호 입력칸은 글자가 가려진다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("입장 비밀번호")).toHaveAttribute("type", "password");
  });

  test("틀린 비밀번호와 빈 비밀번호는 거부되고 입장 화면에 머문다", async ({ page }) => {
    await page.goto("/login");
    const alert = page.locator("form").getByRole("alert");

    await login(page, "");
    await expect(alert).toHaveText("비밀번호를 입력해 주세요.");

    await login(page, `${PASSWORD}-틀림`);
    await expect(alert).toHaveText("비밀번호가 올바르지 않습니다.");
    await expect(page).toHaveURL(/\/login$/);
    await expectLoggedOutHeader(page);
  });

  test("맞는 비밀번호로 입장하면 목록으로 가고 상단 메뉴가 바뀐다", async ({ page }) => {
    await page.goto("/login");
    await login(page, PASSWORD);
    await expect(page).toHaveURL(/\/$/);
    await expectMemberHeader(page);
  });

  test("돌아갈 주소가 있으면 입장 후 그곳으로 간다", async ({ page }) => {
    await page.goto("/login?next=/new");
    await login(page, PASSWORD);
    await expect(page).toHaveURL(/\/new$/);
  });

  for (const next of ["https://example.com", "//example.com", "/\\example.com", "/\t/example.com"]) {
    test(`외부 주소(${JSON.stringify(next)})는 무시하고 목록으로 간다`, async ({ page }) => {
      await page.goto(`/login?next=${encodeURIComponent(next)}`);
      await login(page, PASSWORD);
      await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    });
  }

  test("입장 쿠키는 브라우저를 닫으면 사라지는 httpOnly 세션 쿠키이고 비밀번호를 담지 않는다", async ({ page, context }) => {
    await page.goto("/login");
    await login(page, PASSWORD);
    await expect(page).toHaveURL(/\/$/);

    const cookies = await context.cookies();
    expect(cookies).toHaveLength(1);
    const [cookie] = cookies;
    expect(cookie.expires).toBe(-1);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.value).not.toContain(PASSWORD);
  });
});

test.describe("입장 API", () => {
  test("빈 값·형식 오류 400, 틀림 401, 맞음 200", async ({ request }) => {
    expect((await request.post("/api/login", { data: { password: "" } })).status()).toBe(400);
    expect((await request.post("/api/login", { data: { password: 1 } })).status()).toBe(400);
    expect((await request.post("/api/login", { data: {} })).status()).toBe(400);
    expect((await request.post("/api/login", { data: { password: `${PASSWORD}x` } })).status()).toBe(401);
    expect((await request.post("/api/login", { data: { password: PASSWORD } })).status()).toBe(200);
  });
});
