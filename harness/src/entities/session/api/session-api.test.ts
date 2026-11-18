import {
  ApiError,
  revokeFirebaseToken,
  serverApi,
  serverApiV3,
} from "@/shared/api";

import { fetchSession, formLogin, logout } from "./session-api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
    serverApiV3: { get: vi.fn(), post: vi.fn() },
    revokeFirebaseToken: vi.fn(async () => {}),
  };
});

const sessionBody = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: null,
  identifier: "hong1234",
  email: "a@b.com",
  phone: "01012345678",
};

describe("fetchSession", () => {
  beforeEach(() => {
    vi.mocked(serverApiV3.get).mockReset();
  });

  it("asks /sec with the X-Path header and returns the view model", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(sessionBody);

    const session = await fetchSession("/mypage/money");

    expect(session.displayName).toBe("hong1234");
    expect(session.isAllowed).toBe(true);
    expect(serverApiV3.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": "/mypage/money" },
      signal: undefined,
    });
  });

  it("rejects with the server error", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValueOnce(
      new ApiError(401, undefined),
    );

    await expect(fetchSession("/")).rejects.toMatchObject({ status: 401 });
  });
});

describe("formLogin", () => {
  it("posts multipart credentials to /login", async () => {
    vi.mocked(serverApi.post).mockResolvedValue({
      result: true,
      authority: "MASTER",
    });

    const result = await formLogin("hong1234", "pw");

    const [path, body] = vi.mocked(serverApi.post).mock.calls[0] ?? [];
    expect(path).toBe("/login");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("username")).toBe("hong1234");
    expect((body as FormData).get("password")).toBe("pw");
    expect(result).toEqual({ result: true, authority: "MASTER" });
  });
});

describe("logout", () => {
  beforeEach(() => vi.mocked(serverApiV3.post).mockReset());

  it("POST /auth/logout이 { result: true }를 주면 끝난다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    await expect(logout()).resolves.toBeUndefined();
    expect(serverApiV3.post).toHaveBeenCalledWith("/auth/logout");
    // 세션이 살아 있을 때 이 기기의 채팅방 잠금부터 풂(가이드 2026-11-03 5번)
    expect(revokeFirebaseToken).toHaveBeenCalledOnce();
  });

  it.each([401, 500])("%s 응답이면 오류를 던진다", async (status) => {
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(status, undefined),
    );
    await expect(logout()).rejects.toMatchObject({ status });
  });

  it("result가 true가 아니면 성공으로 간주하지 않는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: false });
    await expect(logout()).rejects.toThrow();
  });
});
