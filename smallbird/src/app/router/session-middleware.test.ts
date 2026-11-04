import { RouterContextProvider } from "react-router";

import { ApiError, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { requireSession, resetSessionMiddleware } from "./session-middleware";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApiV3: { get: vi.fn() },
}));

function runRequireSession(pathname: string) {
  const url = new URL(pathname, "http://localhost");
  return requireSession(
    {
      request: new Request(url),
      url,
      pattern: pathname,
      params: {},
      context: new RouterContextProvider(),
    },
    () => Promise.resolve(undefined),
  );
}

beforeEach(() => {
  resetSessionMiddleware();
  vi.mocked(serverApiV3.get).mockReset();
});

describe("requireSession", () => {
  // 홈은 지금 로그인이 선택이라 이 middleware를 쓰지 않지만, 보호 화면이 되더라도 되돌려 보내기가 끝나야 함.
  it("홈마저 권한이 없으면 되돌려 보내지 않고 403 에러로 끝낸다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(403, undefined));

    await expect(runRequireSession(ROUTES.main)).rejects.toMatchObject({
      init: { status: 403 },
    });
  });
});
