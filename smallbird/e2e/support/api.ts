import { test as base, type Page, type Route } from "@playwright/test";

// playwright.config.ts 의 VITE_API_*_URL 과 같은 접두사. 앱의 모든 API 요청이 이 아래로 간다.
const API_PREFIX = "/e2e-api";

type Handler = (route: Route) => unknown;

export interface MockApi {
  /** `GET /e2e-api/server/v3/sec` 같은 요청에 응답을 정한다. 같은 키를 다시 정하면 덮어쓴다. */
  on(method: string, path: string, handler: Handler): void;
  json(method: string, path: string, body: unknown, status?: number): void;
  /** 응답을 정하지 않아 404 로 돌려준 요청. 화면이 예상 밖 API 를 부르는지 볼 때 쓴다. */
  unhandled: string[];
}

/** 메뉴 권한이 모두 있는 MASTER 세션(`GET /v3/sec`). */
export const masterSession = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: "테스트",
  identifier: "tester",
  email: "test@example.com",
};

async function installMockApi(page: Page): Promise<MockApi> {
  const handlers = new Map<string, Handler>();
  const unhandled: string[] = [];

  await page.route(`**${API_PREFIX}/**`, (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const key = `${request.method()} ${pathname.slice(API_PREFIX.length)}`;
    const handler = handlers.get(key);
    if (handler) return handler(route);
    unhandled.push(key);
    return route.fulfill({ status: 404, json: { result: false } });
  });

  const on = (method: string, path: string, handler: Handler) => {
    handlers.set(`${method} ${path}`, handler);
  };

  return {
    on,
    json: (method, path, body, status = 200) =>
      on(method, path, (route) => route.fulfill({ status, json: body })),
    unhandled,
  };
}

export const test = base.extend<{ api: MockApi }>({
  // Playwright 문서의 `use` 이름은 React 훅 린트 규칙이 훅으로 오인해 `provide`로 받는다.
  api: async ({ page }, provide, testInfo) => {
    const api = await installMockApi(page);
    await provide(api);
    if (api.unhandled.length > 0) {
      testInfo.annotations.push({
        type: "응답을 정하지 않은 API",
        description: [...new Set(api.unhandled)].join(", "),
      });
    }
  },
});

export { expect } from "@playwright/test";
