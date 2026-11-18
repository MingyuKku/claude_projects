import { requestAppleCode } from "./apple-authorize";

const init = vi.fn();
const signIn = vi.fn();

vi.mock("./load-script", () => ({
  loadAppleScript: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  init.mockReset();
  signIn.mockReset();
  window.AppleID = { auth: { init, signIn } };
});

afterEach(() => {
  delete window.AppleID;
});

function stateSentToApple(): string {
  const options = init.mock.calls[0]?.[0] as { state: string };
  return options.state;
}

describe("requestAppleCode", () => {
  it("팝업 모드로 init하고 같은 state가 돌아오면 인가 코드와 redirectUri를 돌려준다", async () => {
    signIn.mockImplementation(() =>
      Promise.resolve({
        authorization: {
          code: "apple-code",
          id_token: "id-token",
          state: stateSentToApple(),
        },
      }),
    );

    const result = await requestAppleCode();

    const options = init.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(result).toEqual({
      code: "apple-code",
      redirectUri: options.redirectURI,
    });
    expect(options.usePopup).toBe(true);
    expect(options.scope).toBe("email");
    expect(options.redirectURI).toMatch(/\/auth\/apple$/);
    expect(options.state).toMatch(/^[0-9a-f]{32}$/);
    expect(options).not.toHaveProperty("responseMode");
  });

  it("호출할 때마다 다른 state를 쓴다", async () => {
    signIn.mockImplementation(() =>
      Promise.resolve({
        authorization: { code: "c", id_token: "t", state: stateSentToApple() },
      }),
    );
    await requestAppleCode();
    const first = stateSentToApple();
    init.mockClear();
    await requestAppleCode();
    expect(stateSentToApple()).not.toBe(first);
  });

  it("돌아온 state가 다르면 오류를 던진다(요청 위조)", async () => {
    signIn.mockResolvedValue({
      authorization: { code: "c", id_token: "t", state: "other" },
    });
    await expect(requestAppleCode()).rejects.toThrow();
  });

  it("인가 코드가 없으면 오류를 던진다", async () => {
    signIn.mockImplementation(() =>
      Promise.resolve({
        authorization: { code: "", id_token: "t", state: stateSentToApple() },
      }),
    );
    await expect(requestAppleCode()).rejects.toThrow();
  });

  it.each(["popup_closed_by_user", "user_cancelled_authorize"])(
    "사용자가 팝업을 닫거나 취소하면(%s) null이다",
    async (error) => {
      signIn.mockRejectedValue({ error });
      await expect(requestAppleCode()).resolves.toBeNull();
    },
  );

  it("그 밖의 오류는 삼키지 않고 던진다", async () => {
    signIn.mockRejectedValue({ error: "invalid_client" });
    await expect(requestAppleCode()).rejects.toEqual({
      error: "invalid_client",
    });
  });

  it("SDK가 없으면 오류를 던진다", async () => {
    delete window.AppleID;
    await expect(requestAppleCode()).rejects.toThrow("애플 SDK");
  });
});
