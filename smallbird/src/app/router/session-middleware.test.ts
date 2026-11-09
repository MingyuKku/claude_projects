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

  describe("Sub ID는 마스터 전용 경로에 들어갈 수 없다", () => {
    function mockAuthority(authority: "MASTER" | "SUB") {
      vi.mocked(serverApiV3.get).mockResolvedValue({
        result: true,
        userIdx: 1,
        accountIdx: 2,
        threadUserIdx: 3,
        authority,
        service: "client",
        nickname: "테스트",
        identifier: "tester",
        email: "test@example.com",
      });
    }

    it.each([
      ROUTES.mypageSubscribe,
      ROUTES.campaignRegister,
      "/campaign/register/CMP-1",
    ])("SUB가 %s로 오면 계정 설정으로 보낸다", async (pathname) => {
      mockAuthority("SUB");

      await expect(runRequireSession(pathname)).rejects.toSatisfy(
        (thrown: unknown) =>
          thrown instanceof Response &&
          thrown.headers.get("Location") === ROUTES.mypageAccount,
      );
    });

    it("SUB도 캠페인 등록 내역과 비슷한 이름의 경로는 막지 않는다", async () => {
      mockAuthority("SUB");

      await expect(
        runRequireSession("/campaign/CMP-1"),
      ).resolves.toBeUndefined();
      await expect(
        runRequireSession("/campaign/registered"),
      ).resolves.toBeUndefined();
    });

    it("MASTER는 캠페인 등록 경로에 들어갈 수 있다", async () => {
      mockAuthority("MASTER");

      await expect(
        runRequireSession("/campaign/register/CMP-1"),
      ).resolves.toBeUndefined();
    });
  });
});
