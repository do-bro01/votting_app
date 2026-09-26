import { expect, test as setup } from "@playwright/test";
import { MEMBER_STATE } from "./support";

setup("입장한 구성원의 저장 상태를 만든다", async ({ request }) => {
  const res = await request.post("/api/login", { data: { password: process.env.ADMIN_TOKEN } });
  expect(res.status()).toBe(200);
  await request.storageState({ path: MEMBER_STATE });
});
