import { serverApiV3 } from "@/shared/api";
import { navigateExternal } from "@/shared/lib";

import { NAVER_LINK_INTENT_KEY } from "../model/constants";
import {
  completeNaverLink,
  readNaverLinkCallback,
  startNaverLink,
} from "./naver-link";

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
    NAVER_LINK_INTENT_KEY,
    JSON.stringify({ state, createdAt }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(navigateExternal).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

describe("startNaverLink", () => {
  it("연결 의도(state)를 저장하고 같은 state를 실은 네이버 인가 주소로 이동한다", async () => {
    expect(await startNaverLink()).toEqual({ status: "redirecting" });
    const saved = JSON.parse(
      sessionStorage.getItem(NAVER_LINK_INTENT_KEY) ?? "{}",
    ) as { state?: string };
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    expect(navigateExternal).toHaveBeenCalledOnce();
    const url = new URL(String(vi.mocked(navigateExternal).mock.calls[0]?.[0]));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://nid.naver.com/oauth2.0/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe(saved.state);
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/auth\/naver$/);
  });

  it("시작할 때마다 다른 state를 쓴다", async () => {
    await startNaverLink();
    const first = sessionStorage.getItem(NAVER_LINK_INTENT_KEY);
    await startNaverLink();
    expect(sessionStorage.getItem(NAVER_LINK_INTENT_KEY)).not.toBe(first);
  });

  it("저장소를 쓸 수 없으면 이동하지 않고 취소로 돌려준다", async () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(await startNaverLink()).toEqual({ status: "cancelled" });
    expect(navigateExternal).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe("readNaverLinkCallback", () => {
  it("쿼리의 state가 저장한 의도와 같으면 인가 코드와 state를 돌려준다", () => {
    saveIntent("abc123");
    expect(readNaverLinkCallback("?code=naver-code&state=abc123")).toEqual({
      code: "naver-code",
      state: "abc123",
    });
  });

  it("저장한 의도가 없으면 일반 로그인이므로 null이다", () => {
    expect(readNaverLinkCallback("?code=naver-code&state=abc123")).toBeNull();
  });

  it("state가 다르거나 없으면 null이다(요청 위조·일반 로그인이 연결로 바뀌지 않음)", () => {
    saveIntent("abc123");
    expect(readNaverLinkCallback("?code=naver-code&state=other")).toBeNull();
    expect(readNaverLinkCallback("?code=naver-code")).toBeNull();
  });

  it("유효 시간(10분)이 지난 의도는 무시한다", () => {
    saveIntent("abc123", Date.now() - 11 * 60 * 1000);
    expect(readNaverLinkCallback("?code=naver-code&state=abc123")).toBeNull();
  });

  it("인가 코드가 없는 쿼리(동의 거부 등)는 null이다", () => {
    saveIntent("abc123");
    expect(
      readNaverLinkCallback("?error=access_denied&state=abc123"),
    ).toBeNull();
  });

  it("읽기만 하고 의도를 지우지 않는다", () => {
    saveIntent("abc123");
    readNaverLinkCallback("?code=naver-code&state=abc123");
    expect(sessionStorage.getItem(NAVER_LINK_INTENT_KEY)).not.toBeNull();
  });
});

describe("completeNaverLink", () => {
  it("의도와 주소 쿼리를 지우고 { code, state }로 연결 API를 불러 성공을 돌려준다", async () => {
    saveIntent("abc123");
    window.history.replaceState(
      null,
      "",
      "/auth/naver?code=naver-code&state=abc123",
    );
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      items: [{ platform: "naver", linked: true, email: "n@example.com" }],
    });

    expect(await completeNaverLink("naver-code", "abc123")).toEqual({
      status: "linked",
    });
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sns/naver", {
      code: "naver-code",
      state: "abc123",
    });
    expect(sessionStorage.getItem(NAVER_LINK_INTENT_KEY)).toBeNull();
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/auth/naver");
  });

  it("서버가 거절하면 사유와 함께 실패를 돌려준다", async () => {
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(409, { result: false, reason: "SNS_LINKED_TO_OTHER_USER" }),
    );
    expect(await completeNaverLink("naver-code", "abc123")).toEqual({
      status: "failed",
      reason: "SNS_LINKED_TO_OTHER_USER",
    });
  });
});
