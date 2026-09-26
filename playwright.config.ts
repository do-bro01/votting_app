import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { MEMBER_STATE } from "./e2e/support";

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
    // 먼저 입장 비밀번호로 입장해 저장 상태를 만든다. 기본 테스트는 입장한 구성원으로 돈다.
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: MEMBER_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // 배포본과 같은 프로덕션 빌드로 테스트한다. 링크 미리 불러오기(prefetch)처럼
    // 개발 서버에서는 일어나지 않는 동작 때문에 생기는 버그를 잡기 위해서다.
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
