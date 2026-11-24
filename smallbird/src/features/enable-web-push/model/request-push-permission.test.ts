import { requestPushPermissionAndRegister } from "./request-push-permission";

const shared = vi.hoisted(() => ({
  getWebPushPermission: vi.fn(),
  requestWebPushPermission: vi.fn(),
}));
vi.mock("@/shared/api", () => shared);

const registerThisDevice = vi.hoisted(() => vi.fn(async () => true));
vi.mock("./register-this-device", () => ({ registerThisDevice }));

describe("requestPushPermissionAndRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("아직 묻지 않았으면 권한을 묻고 허용하면 이 기기를 등록한다", async () => {
    shared.getWebPushPermission.mockReturnValue("default");
    shared.requestWebPushPermission.mockResolvedValue("granted");

    await requestPushPermissionAndRegister();

    expect(shared.requestWebPushPermission).toHaveBeenCalledTimes(1);
    expect(registerThisDevice).toHaveBeenCalledTimes(1);
  });

  it("권한 창을 클릭 핸들러 안에서 동기로 띄운다(await 앞)", () => {
    shared.getWebPushPermission.mockReturnValue("default");
    shared.requestWebPushPermission.mockResolvedValue("denied");

    void requestPushPermissionAndRegister();

    expect(shared.requestWebPushPermission).toHaveBeenCalledTimes(1);
  });

  it("차단하면 등록하지 않는다", async () => {
    shared.getWebPushPermission.mockReturnValue("default");
    shared.requestWebPushPermission.mockResolvedValue("denied");

    await requestPushPermissionAndRegister();

    expect(registerThisDevice).not.toHaveBeenCalled();
  });

  it.each(["granted", "denied", "unsupported"])(
    "이미 %s이면 묻지도 등록하지도 않는다",
    async (permission) => {
      shared.getWebPushPermission.mockReturnValue(permission);

      await requestPushPermissionAndRegister();

      expect(shared.requestWebPushPermission).not.toHaveBeenCalled();
      expect(registerThisDevice).not.toHaveBeenCalled();
    },
  );

  it("권한 요청이 실패해도 던지지 않는다", async () => {
    shared.getWebPushPermission.mockReturnValue("default");
    shared.requestWebPushPermission.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(requestPushPermissionAndRegister()).resolves.toBeUndefined();
    expect(registerThisDevice).not.toHaveBeenCalled();
  });
});
