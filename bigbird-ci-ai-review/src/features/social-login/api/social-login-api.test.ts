import { googleLogin, socialLink, socialLogin } from "./social-login-api";

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

  it("opens the session when the relay answers C01", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            code: "C01",
            tokenResponse: { tokenType: "Bearer ", accessToken: "tok" },
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}));

    await expect(socialLogin({ platform: "naver", uid: "1" })).resolves.toEqual(
      { status: "success" },
    );

    const jwtCall = fetchMock.mock.calls[1];
    expect(String(jwtCall?.[0])).toContain("/jwt/login");
    expect(jwtCall?.[1]?.headers).toMatchObject({
      Authorization: "Bearer tok",
    });
  });

  it("hands the provider identity over when the account is unregistered", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { code: "C02" } }));
    const payload = { platform: "kakao", uid: "7", email: "a@b.com" };

    await expect(socialLogin(payload)).resolves.toEqual({
      status: "needsLink",
      snsData: payload,
    });
  });

  it("takes the google identity from the token response on C02", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: { code: "C02", tokenResponse: { uid: "g1", email: "g@x.com" } },
      }),
    );

    await expect(googleLogin("code")).resolves.toEqual({
      status: "needsLink",
      snsData: { platform: "google", uid: "g1", email: "g@x.com" },
    });
  });

  it("fails for any other code", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { code: "C99" } }));
    await expect(googleLogin("code")).resolves.toEqual({ status: "failed" });
  });

  it("rejects a link response without a numeric code", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "200" }));
    await expect(socialLink("kakao", 1, "a@b.com", "7")).rejects.toThrow();
  });
});
