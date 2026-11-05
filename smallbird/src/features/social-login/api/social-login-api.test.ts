import {
  appleLogin,
  googleLogin,
  kakaoLogin,
  naverLogin,
} from "./social-login-api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("social login api", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("googleLogin (V3)", () => {
    it("{ code, redirectUri }를 보내 세션을 연다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ userIdx: 3, authority: "ROLE_ADVERTISER" }),
      );

      await expect(
        googleLogin("google-code", "https://example.com/auth/google"),
      ).resolves.toEqual({ status: "success" });

      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(String(url)).toContain("/v3/auth/sns/google/login");
      expect(JSON.parse(String(init?.body))).toEqual({
        code: "google-code",
        redirectUri: "https://example.com/auth/google",
      });
    });

    it("미가입(404 NEED_SIGNUP)이면 신원 토큰을 들고 연동 화면으로 넘긴다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          {
            result: false,
            reason: "NEED_SIGNUP",
            platform: "google",
            email: "g@x.com",
            snsLinkToken: "signed-token",
          },
          404,
        ),
      );
      await expect(googleLogin("c", "https://example.com/x")).resolves.toEqual({
        status: "needsLink",
        snsData: {
          platform: "google",
          email: "g@x.com",
          snsLinkToken: "signed-token",
        },
      });
    });

    it("그 밖의 거절은 failed다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ result: false, reason: "INVALID_SNS_CODE" }, 400),
      );
      await expect(googleLogin("c", "https://example.com/x")).resolves.toEqual({
        status: "failed",
      });
    });
  });

  describe("kakaoLogin (V3)", () => {
    it("인가 코드를 V3 로그인에 보내고 세션 쿠키로 열리므로 따로 세션을 열지 않는다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ userIdx: 3, authority: "ROLE_ADVERTISER" }),
      );

      await expect(
        kakaoLogin("auth-code", "https://example.com/auth/kakao"),
      ).resolves.toEqual({ status: "success" });

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(String(url)).toContain("/v3/auth/sns/kakao/login");
      expect(JSON.parse(String(init?.body))).toEqual({
        code: "auth-code",
        redirectUri: "https://example.com/auth/kakao",
      });
    });

    it("미가입(404 NEED_SIGNUP)이면 신원 토큰을 들고 연동 화면으로 넘긴다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          {
            result: false,
            reason: "NEED_SIGNUP",
            platform: "kakao",
            email: "k@b.co",
            snsLinkToken: "signed-token",
          },
          404,
        ),
      );
      await expect(kakaoLogin("c", "https://example.com/x")).resolves.toEqual({
        status: "needsLink",
        snsData: {
          platform: "kakao",
          email: "k@b.co",
          snsLinkToken: "signed-token",
        },
      });
    });

    it("신원 토큰이 없는 NEED_SIGNUP이나 그 밖의 거절은 failed다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ result: false, reason: "NEED_SIGNUP" }, 404),
      );
      await expect(kakaoLogin("c", "https://example.com/x")).resolves.toEqual({
        status: "failed",
      });
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ result: false, reason: "INVALID_SNS_CODE" }, 400),
      );
      await expect(kakaoLogin("c", "https://example.com/x")).resolves.toEqual({
        status: "failed",
      });
    });

    it("네트워크 오류는 삼키지 않고 던진다", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("network"));
      await expect(kakaoLogin("c", "https://example.com/x")).rejects.toThrow(
        "network",
      );
    });
  });

  describe("naverLogin (V3)", () => {
    it("{ code, state }를 보내 세션을 연다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ userIdx: 3, authority: "ROLE_ADVERTISER" }),
      );

      await expect(naverLogin("naver-code", "abc123")).resolves.toEqual({
        status: "success",
      });

      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(String(url)).toContain("/v3/auth/sns/naver/login");
      expect(JSON.parse(String(init?.body))).toEqual({
        code: "naver-code",
        state: "abc123",
      });
    });

    it("미가입(404 NEED_SIGNUP)이면 신원 토큰을 들고 연동 화면으로 넘긴다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          {
            result: false,
            reason: "NEED_SIGNUP",
            platform: "naver",
            email: "n@b.co",
            snsLinkToken: "signed-token",
          },
          404,
        ),
      );
      await expect(naverLogin("c", "s")).resolves.toEqual({
        status: "needsLink",
        snsData: {
          platform: "naver",
          email: "n@b.co",
          snsLinkToken: "signed-token",
        },
      });
    });
  });

  describe("appleLogin (V3)", () => {
    it("{ code, redirectUri }를 보내 세션을 연다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ userIdx: 3, authority: "ROLE_ADVERTISER" }),
      );

      await expect(
        appleLogin("apple-code", "https://x.test/auth/apple"),
      ).resolves.toEqual({
        status: "success",
      });

      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(String(url)).toContain("/v3/auth/sns/apple/login");
      expect(JSON.parse(String(init?.body))).toEqual({
        code: "apple-code",
        redirectUri: "https://x.test/auth/apple",
      });
    });

    it("미가입(404 NEED_SIGNUP)이면 신원 토큰을 들고 연동 화면으로 넘긴다", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          {
            result: false,
            reason: "NEED_SIGNUP",
            platform: "apple",
            email: "a@privaterelay.appleid.com",
            snsLinkToken: "signed-token",
          },
          404,
        ),
      );
      await expect(
        appleLogin("c", "https://x.test/auth/apple"),
      ).resolves.toEqual({
        status: "needsLink",
        snsData: {
          platform: "apple",
          email: "a@privaterelay.appleid.com",
          snsLinkToken: "signed-token",
        },
      });
    });
  });
});
