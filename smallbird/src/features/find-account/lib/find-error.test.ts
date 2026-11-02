import { ApiError } from "@/shared/api";

import {
  extractAuthErrorCode,
  breakTimeMessage,
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

describe("breakTimeMessage", () => {
  it("shows seconds only under a minute", () =>
    expect(breakTimeMessage(45)).toEqual({
      code: "breakTimeSeconds",
      values: { seconds: 45 },
    }));
  it("shows minutes and seconds from a minute", () =>
    expect(breakTimeMessage(125)).toEqual({
      code: "breakTimeMinutes",
      values: { minutes: 2, seconds: 5 },
    }));
});

describe("mapFindError", () => {
  it("no result", () =>
    expect(mapFindError("no result")).toEqual({ code: "notFoundEmail" }));
  it("authNum missmatch is one line without a remaining count", () =>
    expect(mapFindError("authNum missmatch")).toEqual({
      code: "authMismatch",
    }));
  it("authNum missmatch appends the remaining count on a second line", () =>
    expect(mapFindError("authNum missmatch", { count: 2 })).toEqual({
      code: "authMismatchRemaining",
      values: { remaining: 2, max: 3 },
    }));
  it("time out", () =>
    expect(mapFindError("time out")).toEqual({ code: "timeOut" }));
  it("request exists", () =>
    expect(mapFindError("request exists")).toEqual({ code: "resendWait" }));

  it("break time reads both spellings", () => {
    expect(mapFindError("break time", { "remaining time": 90 })).toEqual({
      code: "breakTimeMinutes",
      values: { minutes: 1, seconds: 30 },
    });
    expect(mapFindError("break time", { "remaing time": 30 })).toEqual({
      code: "breakTimeSeconds",
      values: { seconds: 30 },
    });
  });

  it("falls back for an unknown reason", () =>
    expect(mapFindError("whatever")).toEqual({ code: "notFoundEmail" }));
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
      message: { code: "notFoundPhone" },
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
  it("keeps valid fields when another field has an unexpected shape", () =>
    expect(
      readEmailData(new ApiError(400, { count: "2", "remaining time": 30 })),
    ).toEqual({ count: undefined, "remaining time": 30 }));
});
