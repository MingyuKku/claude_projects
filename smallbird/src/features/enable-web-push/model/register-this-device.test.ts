import { getWebPushToken, saveWebPushToken, serverApiV3 } from "@/shared/api";

import { registerThisDevice } from "./register-this-device";

vi.mock("@/shared/api", () => ({
  getWebPushToken: vi.fn(),
  saveWebPushToken: vi.fn(),
  serverApiV3: { post: vi.fn() },
}));

describe("registerThisDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("토큰을 받으면 이 기기를 서버에 등록하고 토큰을 기억한다", async () => {
    vi.mocked(getWebPushToken).mockResolvedValue("token-1");
    vi.mocked(serverApiV3.post).mockResolvedValue(undefined);

    await expect(registerThisDevice()).resolves.toBe(true);

    expect(serverApiV3.post).toHaveBeenCalledExactlyOnceWith(
      "/notifications/devices",
      {
        token: "token-1",
        platform: "WEB",
        deviceName: expect.any(String),
      },
    );
    expect(saveWebPushToken).toHaveBeenCalledExactlyOnceWith("token-1");
  });

  it("권한이 없거나 지원하지 않아 토큰이 없으면 요청하지 않는다", async () => {
    vi.mocked(getWebPushToken).mockResolvedValue(null);

    await expect(registerThisDevice()).resolves.toBe(false);

    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(saveWebPushToken).not.toHaveBeenCalled();
  });

  it("토큰 발급이 실패하면 오류를 던지지 않고 등록하지 않는다", async () => {
    vi.mocked(getWebPushToken).mockRejectedValue(new Error("fcm"));

    await expect(registerThisDevice()).resolves.toBe(false);
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("서버 등록이 실패하면 토큰을 기억하지 않는다", async () => {
    vi.mocked(getWebPushToken).mockResolvedValue("token-1");
    vi.mocked(serverApiV3.post).mockRejectedValue(new Error("500"));

    await expect(registerThisDevice()).resolves.toBe(false);
    expect(saveWebPushToken).not.toHaveBeenCalled();
  });
});
