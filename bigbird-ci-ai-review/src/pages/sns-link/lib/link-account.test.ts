import { linkAccount } from "./link-account";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const snsData = { platform: "kakao", uid: "7", email: "a@b.com" };

describe("linkAccount", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("links the SNS identity after a successful login", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ result: true, userIdx: 3 }))
      .mockResolvedValueOnce(jsonResponse({ code: 200 }));

    await expect(linkAccount("id", "pw", snsData)).resolves.toEqual({
      isLinked: true,
    });

    const linkCall = fetchMock.mock.calls[1];
    expect(String(linkCall?.[0])).toContain("/auth/kakao/3");
    expect(linkCall?.[1]?.method).toBe("PUT");
    expect(linkCall?.[1]?.body).toBe(
      JSON.stringify({ platform: "kakao", email: "a@b.com", uid: "7" }),
    );
  });

  it("reports a credential mismatch without linking", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: false }));

    const result = await linkAccount("id", "bad", snsData);
    expect(result).toEqual({
      isLinked: false,
      message: "입력하신 아이디와 비밀번호가 등록된 정보와 일치하지 않습니다",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("asks to contact an admin when the link code is not 200", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ result: true, userIdx: 3 }))
      .mockResolvedValueOnce(jsonResponse({ code: 409 }));

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: false,
      message: "연동되지 않았습니다. 관리자에게 문의해주세요",
    });
  });

  it("shows the login error for HTTP failures", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

    expect(await linkAccount("id", "pw", snsData)).toEqual({
      isLinked: false,
      message: "로그인 중 오류가 발생했습니다",
    });
  });

  it("refuses to link when there is no SNS identity", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: true, userIdx: 3 }));

    expect(await linkAccount("id", "pw", undefined)).toEqual({
      isLinked: false,
      message: "SNS 연동 정보가 없습니다",
    });
  });
});
