import { ApiError } from "@/shared/api";

import {
  extractAuthErrorCode,
  formatBreakTime,
  isValidEmail,
  mapAuthErrorCode,
  mapFindError,
  readEmailData,
  readEmailReason,
} from "./find-error";

describe("isValidEmail", () => {
  it("accepts a well-formed address", () =>
    expect(isValidEmail("a@b.com")).toBe(true));
  it("rejects a malformed address", () =>
    expect(isValidEmail("nope")).toBe(false));
});

describe("formatBreakTime", () => {
  it("shows seconds only under a minute", () =>
    expect(formatBreakTime(45)).toBe("45초"));
  it("shows minutes and seconds from a minute", () =>
    expect(formatBreakTime(125)).toBe("2분 5초"));
});

describe("mapFindError", () => {
  it("no result", () =>
    expect(mapFindError("no result")).toBe(
      "이름과 이메일이 일치하는 계정을 찾을 수 없습니다.",
    ));
  it("authNum missmatch is one line without a remaining count", () =>
    expect(mapFindError("authNum missmatch")).toBe(
      "인증번호가 일치하지 않습니다.",
    ));
  it("authNum missmatch appends the remaining count on a second line", () =>
    expect(mapFindError("authNum missmatch", { count: 2 })).toBe(
      "인증번호가 일치하지 않습니다.\n(남은 횟수 2/3)",
    ));
  it("time out", () =>
    expect(mapFindError("time out")).toBe("입력시간 초과되었습니다"));
  it("request exists", () =>
    expect(mapFindError("request exists")).toBe(
      "인증시간(1분)이 종료 된 후 다시 시도 해주세요",
    ));

  it("break time reads both spellings", () => {
    expect(mapFindError("break time", { "remaining time": 90 })).toBe(
      "1분 30초 후에 다시 시도 해주세요",
    );
    expect(mapFindError("break time", { "remaing time": 30 })).toBe(
      "30초 후에 다시 시도 해주세요",
    );
  });

  it("falls back for an unknown reason", () =>
    expect(mapFindError("whatever")).toBe(
      "이름과 이메일이 일치하는 계정을 찾을 수 없습니다.",
    ));
});

describe("extractAuthErrorCode", () => {
  it("reads a code nested in an ApiError body", () =>
    expect(
      extractAuthErrorCode(
        new ApiError(400, { success: false, data: { code: "AUTH003" } }),
      ),
    ).toBe("AUTH003"));
  it("reads a flat code in an ApiError body", () =>
    expect(extractAuthErrorCode(new ApiError(400, { code: "AUTH011" }))).toBe(
      "AUTH011",
    ));
  it("reads a 200 + success:false body", () =>
    expect(extractAuthErrorCode({ data: { code: "AUTH012" } })).toBe(
      "AUTH012",
    ));
  it("returns an empty string without a code", () =>
    expect(extractAuthErrorCode({})).toBe(""));
  it("does not throw on non-objects", () =>
    expect(extractAuthErrorCode(null)).toBe(""));
});

describe("mapAuthErrorCode", () => {
  it("returns the message and inline flag for a known code", () =>
    expect(mapAuthErrorCode("AUTH003")).toEqual({
      message: "이름과 휴대전화번호가 일치하는 계정을 찾을 수 없습니다.",
      isInline: true,
    }));
  it("uses the popup default for an unknown code", () =>
    expect(mapAuthErrorCode("AUTH777").isInline).toBe(false));
});

describe("member backend error body", () => {
  it("reads the reason from message, reason or result", () => {
    expect(readEmailReason(new ApiError(400, { message: "time out" }))).toBe(
      "time out",
    );
    expect(readEmailReason(new ApiError(400, { reason: "break time" }))).toBe(
      "break time",
    );
    expect(readEmailReason(new ApiError(400, { result: "no result" }))).toBe(
      "no result",
    );
  });
  it("falls back to no result for non-API errors", () =>
    expect(readEmailReason(new Error("network"))).toBe("no result"));
  it("exposes the body as extra data", () =>
    expect(readEmailData(new ApiError(400, { count: 2 }))).toEqual({
      count: 2,
    }));
});
