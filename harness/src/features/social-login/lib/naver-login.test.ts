import { navigateExternal } from "@/shared/lib";

import { NAVER_LOGIN_INTENT_KEY } from "../model/constants";
import { startNaverLogin, takeNaverLoginCallback } from "./naver-login";

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, navigateExternal: vi.fn() };
});

function saveIntent(state: string, createdAt = Date.now()) {
  sessionStorage.setItem(
    NAVER_LOGIN_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(navigateExternal).mockReset();
});

describe("startNaverLogin", () => {
  it("로그인 의도(state)를 저장하고 같은 state를 실은 네이버 인가 주소(code 방식)로 이동한다", async () => {
    await startNaverLogin();
    const saved = JSON.parse(
      sessionStorage.getItem(NAVER_LOGIN_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    const url = new URL(String(vi.mocked(navigateExternal).mock.calls[0]?.[0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://nid.naver.com/oauth2.0/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe(saved.state);
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/auth\/naver$/);
  });

  it("저장소를 쓸 수 없으면 이동하지 않고 오류를 던진다(화면이 실패 안내를 보임)", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    await expect(startNaverLogin()).rejects.toThrow();
    expect(navigateExternal).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe("takeNaverLoginCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 state를 돌려주고 의도를 지운다", () => {
    saveIntent("abc123");
    expect(takeNaverLoginCallback("?code=auth-code&state=abc123")).toEqual({
      code: "auth-code",
      state: "abc123",
    });
    expect(sessionStorage.getItem(NAVER_LOGIN_INTENT_KEY)).toBeNull();
  });

  it("저장한 의도가 없으면 null이다(우리가 시작하지 않은 복귀)", () => {
    expect(takeNaverLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이고 의도는 지운다(요청 위조는 한 번만 시도할 수 있음)", () => {
    saveIntent("abc123");
    expect(takeNaverLoginCallback("?code=auth-code&state=other")).toBeNull();
    expect(sessionStorage.getItem(NAVER_LOGIN_INTENT_KEY)).toBeNull();
    saveIntent("abc123");
    expect(takeNaverLoginCallback("?code=auth-code")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(takeNaverLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      takeNaverLoginCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });
});
