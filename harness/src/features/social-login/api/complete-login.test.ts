import { serverApiV3 } from "@/shared/api";

import { loginWithApple } from "./complete-login";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { post: vi.fn() } };
});
vi.mock("../lib/load-script", () => ({
  loadAppleScript: vi.fn().mockResolvedValue(undefined),
}));

const init = vi.fn();
const signIn = vi.fn();

beforeEach(() => {
  init.mockReset();
  signIn.mockReset();
  vi.mocked(serverApiV3.post).mockReset();
  window.AppleID = { auth: { init, signIn } };
  // 팝업은 init에 넣은 state를 그대로 돌려줌.
  signIn.mockImplementation(() => {
    const options = init.mock.calls[0]?.[0] as { state: string };
    return Promise.resolve({
      authorization: { code: "c", id_token: "t", state: options.state },
    });
  });
});

afterEach(() => {
  delete window.AppleID;
});

describe("loginWithApple", () => {
  it("코드를 받은 뒤 서버 호출이 실패하면 던지지 않고 로그인 실패로 돌려준다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(new TypeError("network"));
    await expect(loginWithApple()).resolves.toEqual({ status: "failed" });
  });

  it("팝업을 열기 전 오류(SDK 없음)는 시작 실패로 알리도록 던진다", async () => {
    delete window.AppleID;
    await expect(loginWithApple()).rejects.toThrow("애플 SDK");
  });
});
