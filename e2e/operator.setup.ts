import { expect, test as setup } from "@playwright/test";
import { OPERATOR_STATE } from "./support";

setup("운영자로 로그인한 저장 상태를 만든다", async ({ request }) => {
  const res = await request.post("/api/operator/login", {
    data: { password: process.env.ADMIN_TOKEN },
  });
  expect(res.status()).toBe(200);
  await request.storageState({ path: OPERATOR_STATE });
});
