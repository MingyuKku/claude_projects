import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("./clients", () => ({ serverApiV3: { delete: del } }));

import { saveWebPushToken, unregisterWebPushDevice } from "./web-push-device";

describe("unregisterWebPushDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("저장된 토큰으로 이 기기를 끈다", async () => {
    saveWebPushToken("token:abc-123_x");

    await unregisterWebPushDevice();

    expect(del).toHaveBeenCalledExactlyOnceWith("/notifications/devices", {
      params: { token: "token:abc-123_x" },
    });
  });

  it("저장된 토큰이 없으면 요청하지 않는다", async () => {
    await unregisterWebPushDevice();

    expect(del).not.toHaveBeenCalled();
  });

  it("끄고 나서도 토큰은 남겨 다음 로그인에서 같은 토큰을 다시 등록한다", async () => {
    saveWebPushToken("token-1");

    await unregisterWebPushDevice();
    await unregisterWebPushDevice();

    expect(del).toHaveBeenCalledTimes(2);
  });

  it("끄기가 실패해도 오류를 던지지 않고 로그만 남긴다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    saveWebPushToken("token-1");
    del.mockRejectedValueOnce(new Error("500"));

    await expect(unregisterWebPushDevice()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "웹푸시 기기 끄기 실패",
      expect.any(Error),
    );
    error.mockRestore();
  });
});
