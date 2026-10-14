import { defineConfig } from "vitest/config";

// vite.config.ts 와 분리한다. 테스트에는 경로 별칭과 jsdom 만 필요하다.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/shared/config/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
