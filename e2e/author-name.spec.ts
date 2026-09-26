import { expect, test } from "@playwright/test";
import { createPoll, testQuestion } from "./support";

test("모든 화면 하단에 만든 사람 이름 '김도형'만 보인다", async ({ page, request }) => {
  const id = await createPoll(request, testQuestion("이름 표시"), ["가", "나"]);
  const paths = ["/", "/new", `/polls/${id}`, `/polls/${id}/results`, `/polls/${crypto.randomUUID()}`];

  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("contentinfo"), path).toHaveText("김도형");
  }
});
