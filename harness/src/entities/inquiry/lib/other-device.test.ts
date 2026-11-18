import { ApiError } from "@/shared/api";

import { isOtherDeviceError } from "./other-device";

describe("isOtherDeviceError", () => {
  it("채팅 REST 409와 Firestore 권한 오류를 다른 기기로 본다", () => {
    expect(isOtherDeviceError(new ApiError(409, undefined))).toBe(true);
    expect(isOtherDeviceError({ code: "permission-denied" })).toBe(true);
  });

  it("그 밖의 오류는 아니다", () => {
    expect(isOtherDeviceError(new ApiError(500, undefined))).toBe(false);
    expect(isOtherDeviceError(new Error("network"))).toBe(false);
  });
});
