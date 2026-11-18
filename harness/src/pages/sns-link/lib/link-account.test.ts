import { linkAccount } from "./link-account";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const snsData = {
  platform: "kakao",
  email: "a@b.com",
  snsLinkToken: "signed-token",
};

describe("linkAccount", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("V3 연동 뒤 로그인해 세션을 연다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({ result: true, userIdx: 3 }));

    await expect(linkAccount("id", "pw", snsData)).resolves.toEqual({
      isLinked: true,
      isSessionOpened: true,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/v3/auth/sns/link");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      id: "id",
      password: "pw",
      snsLinkToken: "signed-token",
    });
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/login");
  });

  it("연동 뒤 폼 로그인이 실패해도(승인 전 계정) 연동은 성공이고 세션만 열리지 않은 것으로 돌려준다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({ result: false }));

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: true,
      isSessionOpened: false,
    });
  });

  it("연동 뒤 폼 로그인이 오류를 던져도 연동은 성공으로 본다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
      .mockResolvedValueOnce(jsonResponse({}, 403));

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: true,
      isSessionOpened: false,
    });
  });

  it("아이디·비밀번호 불일치(401 INVALID_CREDENTIALS)면 로그인하지 않는다", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ result: false, reason: "INVALID_CREDENTIALS" }, 401),
    );

    expect(await linkAccount("id", "bad", snsData)).toEqual({
      isLinked: false,
      code: "credentialMismatch",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("토큰 만료·계정 잠금·이미 연결됨 같은 그 밖의 거절은 linkFailed다", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ result: false, reason: "INVALID_SNS_LINK_TOKEN" }, 400),
    );

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: false,
      code: "linkFailed",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("네트워크 오류도 linkFailed다", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("network"));

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: false,
      code: "linkFailed",
    });
  });

  it("SNS 신원이 없으면 서버를 부르지 않고 안내한다", async () => {
    expect(await linkAccount("id", "pw", undefined)).toEqual({
      isLinked: false,
      code: "missingSnsData",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
