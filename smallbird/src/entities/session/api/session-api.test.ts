import { ApiError, serverApi, serverApiV3 } from "@/shared/api";

import { fetchSession, formLogin, logout } from "./session-api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
    serverApiV3: { get: vi.fn() },
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
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(401, undefined));

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
  afterEach(() => vi.unstubAllGlobals());

  it("302 수동 응답이면 쿠키 만료 요청이 끝난다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ type: "opaqueredirect" }),
    );
    await expect(logout()).resolves.toBeUndefined();
  });

  it.each([200, 401, 500])(
    "리다이렉트가 아닌 %s 응답을 성공으로 간주하지 않는다",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status })),
      );
      await expect(logout()).rejects.toMatchObject({ status });
    },
  );
});
