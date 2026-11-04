import { navigateExternal } from "@/shared/lib";

import { KAKAO_LOGIN_INTENT_KEY } from "../model/constants";
import { startKakaoLogin, takeKakaoLoginCallback } from "./kakao-login";

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, navigateExternal: vi.fn() };
});

function saveIntent(state: string, createdAt = Date.now()) {
  sessionStorage.setItem(
    KAKAO_LOGIN_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(navigateExternal).mockReset();
});

describe("startKakaoLogin", () => {
  it("로그인 의도(state)를 저장하고 같은 state를 실은 카카오 인가 주소(code 방식)로 이동한다", async () => {
    await startKakaoLogin();
    const saved = JSON.parse(
      sessionStorage.getItem(KAKAO_LOGIN_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    const url = new URL(String(vi.mocked(navigateExternal).mock.calls[0]?.[0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe(saved.state);
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/auth\/kakao$/);
  });

  it("저장소를 쓸 수 없으면 이동하지 않고 오류를 던진다(화면이 실패 안내를 보임)", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    await expect(startKakaoLogin()).rejects.toThrow();
    expect(navigateExternal).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe("takeKakaoLoginCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 redirectUri를 돌려주고 의도를 지운다", () => {
    saveIntent("abc123");
    const result = takeKakaoLoginCallback("?code=auth-code&state=abc123");
    expect(result?.code).toBe("auth-code");
    expect(result?.redirectUri).toMatch(/\/auth\/kakao$/);
    expect(sessionStorage.getItem(KAKAO_LOGIN_INTENT_KEY)).toBeNull();
  });

  it("저장한 의도가 없으면 null이다(우리가 시작하지 않은 복귀)", () => {
    expect(takeKakaoLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이고 의도는 지운다(요청 위조는 한 번만 시도할 수 있음)", () => {
    saveIntent("abc123");
    expect(takeKakaoLoginCallback("?code=auth-code&state=other")).toBeNull();
    expect(sessionStorage.getItem(KAKAO_LOGIN_INTENT_KEY)).toBeNull();
    saveIntent("abc123");
    expect(takeKakaoLoginCallback("?code=auth-code")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(takeKakaoLoginCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      takeKakaoLoginCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });
});
