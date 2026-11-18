import { GOOGLE_LOGIN_INTENT_KEY } from "../model/constants";
import { startGoogleLogin, takeGoogleLoginCallback } from "./google-login";
import { requestGoogleCode } from "./start-login";

function saveIntent(state: string, createdAt = Date.now()) {
  sessionStorage.setItem(
    GOOGLE_LOGIN_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(requestGoogleCode).mockReset();
});

vi.mock("./start-login", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, requestGoogleCode: vi.fn() };
});

describe("startGoogleLogin", () => {
  it("로그인 의도(state)를 저장하고 같은 state로 구글 인가 코드를 요청한다", async () => {
    vi.mocked(requestGoogleCode).mockResolvedValueOnce(undefined);
    await startGoogleLogin();
    const saved = JSON.parse(
      sessionStorage.getItem(GOOGLE_LOGIN_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    expect(requestGoogleCode).toHaveBeenCalledWith(saved.state);
  });

  it("저장소를 쓸 수 없으면 요청하지 않고 오류를 던진다(화면이 실패 안내를 보임)", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    await expect(startGoogleLogin()).rejects.toThrow();
    expect(requestGoogleCode).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("SDK 요청이 실패하면 남은 의도를 지우고 오류를 던진다", async () => {
    vi.mocked(requestGoogleCode).mockRejectedValueOnce(
      new Error("load failed"),
    );
    await expect(startGoogleLogin()).rejects.toThrow("load failed");
    expect(sessionStorage.getItem(GOOGLE_LOGIN_INTENT_KEY)).toBeNull();
  });
});

describe("takeGoogleLoginCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 redirectUri를 돌려주고 의도를 지운다", () => {
    saveIntent("abc123");
    const result = takeGoogleLoginCallback("?code=auth-code&state=abc123");
    expect(result?.code).toBe("auth-code");
    expect(result?.redirectUri).toMatch(/\/auth\/google$/);
    expect(sessionStorage.getItem(GOOGLE_LOGIN_INTENT_KEY)).toBeNull();
  });

  it("저장한 의도가 없으면 null이다(우리가 시작하지 않은 복귀)", () => {
    expect(takeGoogleLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이고 의도는 지운다(요청 위조는 한 번만 시도할 수 있음)", () => {
    saveIntent("abc123");
    expect(takeGoogleLoginCallback("?code=auth-code&state=other")).toBeNull();
    expect(sessionStorage.getItem(GOOGLE_LOGIN_INTENT_KEY)).toBeNull();
    saveIntent("abc123");
    expect(takeGoogleLoginCallback("?code=auth-code")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(takeGoogleLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      takeGoogleLoginCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });
});
