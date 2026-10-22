import { defineConfig } from "vitest/config";

// vite.config.ts 와 분리한다. 테스트에는 경로 별칭과 jsdom 만 필요하다.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // jsdom 생성을 파일마다가 아닌 worker 당 한 번으로 줄인다(파일별 격리는 VM 컨텍스트로 유지).
    // VM 컨텍스트에서는 window.location 을 바꿔 끼울 수 없으므로 이동은 @/shared/lib 의 hardNavigate 를 목킹해 검증한다.
    pool: "vmThreads",
    // VM 컨텍스트는 파일을 실행할수록 worker 메모리가 쌓이므로, 이 값을 넘으면 worker 를 다시 띄운다.
    // 기본값(시스템 메모리 ÷ worker 수)은 컨테이너에서 실제보다 큰 메모리를 기준으로 삼을 수 있어 고정값으로 둔다.
    // 2026-10 기준 전체 테스트를 worker 1개로 실행할 때 최대 약 700MB였다. 이보다 낮추면 재시작이 잦아진다.
    vmMemoryLimit: "1GB",
    globals: true,
    setupFiles: [
      "./src/shared/config/test-setup.ts",
      "./src/app/i18n/test-setup.ts",
    ],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
