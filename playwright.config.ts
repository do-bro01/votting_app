import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { OPERATOR_STATE } from "./e2e/support";

// 테스트 정리(cleanup)가 DB에 직접 접근하므로 .env.local의 DATABASE_URL을 읽는다.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  workers: 3,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // 마감 시각 입력(현지 시각)과 표시(한국 시간)를 결정적으로 검증하기 위해 고정한다.
    timezoneId: "Asia/Seoul",
    locale: "ko-KR",
  },
  projects: [
    // 먼저 운영자로 로그인해 저장 상태를 만든다. 기본 테스트는 운영자로 돈다.
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: OPERATOR_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
