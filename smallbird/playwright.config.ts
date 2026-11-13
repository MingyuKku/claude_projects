import { defineConfig, devices } from "@playwright/test";

// E2E 스모크: 빌드한 번들을 `vite preview`로 띄워 실제 브라우저에서 여러 화면을 잇는 흐름을 확인한다.
// 단일 화면 동작은 Vitest(jsdom)가 맡는다. 백엔드는 부르지 않고 e2e/support/api.ts 가 브라우저에서 응답을 정한다.
const PORT = 4317;
const OUTPUT = "e2e/.output";

export default defineConfig({
  testDir: "e2e",
  outputDir: `${OUTPUT}/test-results`,
  forbidOnly: !!process.env.CI,
  // 시범 운영 기간에는 재시도로 간헐 실패를 가리지 않는다. 실패하면 trace 로 원인을 본다.
  retries: 0,
  reporter: process.env.CI
    ? [
        ["list"],
        ["junit", { outputFile: `${OUTPUT}/junit.xml` }],
        ["html", { outputFolder: `${OUTPUT}/report`, open: "never" }],
      ]
    : [["list"], ["html", { outputFolder: `${OUTPUT}/report`, open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 기본 언어(ko) 화면 문구로 요소를 찾는다.
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-pc",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    // 소스가 아니라 빌드 결과물을 띄워야 번들·지연 로딩 문제까지 잡힌다.
    command: `pnpm exec vite build --outDir ${OUTPUT}/dist --emptyOutDir && pnpm exec vite preview --outDir ${OUTPUT}/dist --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    // API 주소를 실제 백엔드가 아닌 경로로 고정해, 응답을 정하지 않은 요청이 밖으로 나가지 않게 한다.
    env: {
      VITE_API_SERVER_URL: "/e2e-api/server",
      VITE_API_MEMBER_URL: "/e2e-api/member",
      VITE_API_AUTH_URL: "/e2e-api/auth",
      VITE_API_PAY_URL: "/e2e-api/pay",
    },
  },
});
