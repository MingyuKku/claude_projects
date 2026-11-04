import { deviceHeaders, getDeviceId } from "./device-id";

describe("getDeviceId", () => {
  beforeEach(() => localStorage.clear());

  it("한 번 만들어 localStorage에 두고 같은 값을 계속 쓴다", () => {
    const first = getDeviceId();
    expect(first).toMatch(/^[\w-]{8,64}$/);
    expect(getDeviceId()).toBe(first);
    expect(localStorage.getItem("bigbird.deviceId")).toBe(first);
    expect(deviceHeaders()).toEqual({ "X-Device-Id": first });
  });

  it("저장된 값이 형식에 맞지 않으면 새로 만든다", () => {
    localStorage.setItem("bigbird.deviceId", "bad id!");
    expect(getDeviceId()).not.toBe("bad id!");
  });
});
