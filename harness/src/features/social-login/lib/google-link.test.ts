import { serverApiV3 } from "@/shared/api";

import { GOOGLE_LINK_INTENT_KEY } from "../model/constants";
import {
  completeGoogleLink,
  readGoogleLinkCallback,
  startGoogleLink,
} from "./google-link";
import { requestGoogleCode } from "./start-login";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});

// GIS 스크립트를 불러와 이동하는 부분만 막고, 넘겨받은 state를 확인함.
vi.mock("./start-login", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, requestGoogleCode: vi.fn() };
});

function saveIntent(state: string, createdAt = Date.now()) {
  sessionStorage.setItem(
    GOOGLE_LINK_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(requestGoogleCode).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

describe("startGoogleLink", () => {
  it("연결 의도(state)를 저장하고 같은 state로 구글 인가 요청을 시작한다", async () => {
    expect(await startGoogleLink()).toEqual({ status: "redirecting" });
    const saved = JSON.parse(
      sessionStorage.getItem(GOOGLE_LINK_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    expect(requestGoogleCode).toHaveBeenCalledWith(saved.state);
  });

  it("저장소를 쓸 수 없으면 시작하지 않고 취소로 돌려준다", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(await startGoogleLink()).toEqual({ status: "cancelled" });
    expect(requestGoogleCode).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("구글 SDK를 불러오지 못하면 남은 의도를 지우고 오류를 던진다", async () => {
    vi.mocked(requestGoogleCode).mockRejectedValueOnce(
      new Error("load failed"),
    );
    await expect(startGoogleLink()).rejects.toThrow("load failed");
    expect(sessionStorage.getItem(GOOGLE_LINK_INTENT_KEY)).toBeNull();
  });
});

describe("readGoogleLinkCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 redirectUri를 돌려준다", () => {
    saveIntent("abc123");
    const result = readGoogleLinkCallback(
      "?code=auth-code&scope=email&state=abc123",
    );
    expect(result?.code).toBe("auth-code");
    expect(result?.redirectUri).toMatch(/\/auth\/google$/);
  });

  it("저장한 의도가 없으면 일반 로그인이므로 null이다", () => {
    expect(readGoogleLinkCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이다(요청 위조·일반 로그인이 연결로 바뀌지 않음)", () => {
    saveIntent("abc123");
    expect(readGoogleLinkCallback("?code=auth-code&state=other")).toBeNull();
    expect(readGoogleLinkCallback("?code=auth-code")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(readGoogleLinkCallback("?code=auth-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      readGoogleLinkCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });

  it("읽기만 하고 의도를 지우지 않는다", () => {
    saveIntent("abc123");
    readGoogleLinkCallback("?code=auth-code&state=abc123");
    expect(sessionStorage.getItem(GOOGLE_LINK_INTENT_KEY)).not.toBeNull();
  });
});

describe("completeGoogleLink", () => {
  it("의도와 주소 쿼리를 지우고 code·redirectUri로 연결 API를 불러 성공을 돌려준다", async () => {
    saveIntent("abc123");
    window.history.replaceState(null, "", "/auth/google?code=c&state=abc123");
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      items: [{ platform: "google", linked: true, email: "g@example.com" }],
    });

    expect(
      await completeGoogleLink("c", "https://example.com/auth/google"),
    ).toEqual({ status: "linked" });
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/mypage/account/sns/google",
      { code: "c", redirectUri: "https://example.com/auth/google" },
    );
    expect(sessionStorage.getItem(GOOGLE_LINK_INTENT_KEY)).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("서버가 거절하면 사유와 함께 실패를 돌려준다", async () => {
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(400, { result: false, reason: "INVALID_SNS_CODE" }),
    );
    expect(await completeGoogleLink("c", "https://example.com/x")).toEqual({
      status: "failed",
      reason: "INVALID_SNS_CODE",
    });
  });
});
