import { serverApiV3 } from "@/shared/api";
import { navigateExternal } from "@/shared/lib";

import { KAKAO_LINK_INTENT_KEY } from "../model/constants";
import {
  completeKakaoLink,
  readKakaoLinkCallback,
  startKakaoLink,
} from "./kakao-link";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, navigateExternal: vi.fn() };
});

function saveIntent(state: string, createdAt = Date.now()) {
  sessionStorage.setItem(
    KAKAO_LINK_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(navigateExternal).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

describe("startKakaoLink", () => {
  it("연결 의도(state)를 저장하고 같은 state를 실은 카카오 인가 주소(code 방식)로 이동한다", async () => {
    expect(await startKakaoLink()).toEqual({ status: "redirecting" });
    const saved = JSON.parse(
      sessionStorage.getItem(KAKAO_LINK_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    expect(navigateExternal).toHaveBeenCalledOnce();
    const url = new URL(String(vi.mocked(navigateExternal).mock.calls[0]?.[0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe(saved.state);
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/auth\/kakao$/);
  });

  it("저장소를 쓸 수 없으면 이동하지 않고 취소로 돌려준다", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(await startKakaoLink()).toEqual({ status: "cancelled" });
    expect(navigateExternal).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe("readKakaoLinkCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 redirectUri를 돌려준다", () => {
    saveIntent("abc123");
    const result = readKakaoLinkCallback("?code=auth-code&state=abc123");
    expect(result?.code).toBe("auth-code");
    expect(result?.redirectUri).toMatch(/\/auth\/kakao$/);
  });

  it("저장한 의도가 없으면 일반 로그인이므로 null이다", () => {
    expect(readKakaoLinkCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이다(요청 위조·SDK 로그인 복귀가 연결로 바뀌지 않음)", () => {
    saveIntent("abc123");
    expect(readKakaoLinkCallback("?code=auth-code&state=other")).toBeNull();
    expect(readKakaoLinkCallback("?code=auth-code")).toBeNull();
    expect(readKakaoLinkCallback("")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(readKakaoLinkCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      readKakaoLinkCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });
});

describe("completeKakaoLink", () => {
  it("의도와 주소 쿼리를 지우고 code·redirectUri로 연결 API를 불러 성공을 돌려준다", async () => {
    saveIntent("abc123");
    window.history.replaceState(null, "", "/auth/kakao?code=c&state=abc123");
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      items: [{ platform: "kakao", linked: true, email: "k@example.com" }],
    });

    expect(
      await completeKakaoLink("c", "https://example.com/auth/kakao"),
    ).toEqual({ status: "linked" });
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sns/kakao", {
      code: "c",
      redirectUri: "https://example.com/auth/kakao",
    });
    expect(sessionStorage.getItem(KAKAO_LINK_INTENT_KEY)).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("서버가 거절하면 사유와 함께 실패를 돌려준다", async () => {
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(400, { result: false, reason: "INVALID_SNS_CODE" }),
    );
    expect(await completeKakaoLink("c", "https://example.com/x")).toEqual({
      status: "failed",
      reason: "INVALID_SNS_CODE",
    });
  });
});
