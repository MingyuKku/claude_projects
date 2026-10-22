import { ApiError } from "@/shared/api";

import {
  DENIED_REASON,
  isTooManyRequests,
  readFailureReason,
  readResultFailure,
} from "./mypage-result";

describe("readFailureReason", () => {
  it("V3ErrorResponse의 reason을 읽는다", () => {
    const error = new ApiError(400, {
      result: false,
      reason: "invalid password",
    });
    expect(readFailureReason(error)).toBe("invalid password");
  });

  it("API 오류가 아니거나 다른 형태면 undefined다", () => {
    expect(readFailureReason(new Error("network"))).toBeUndefined();
    expect(readFailureReason(new ApiError(500, "<html>"))).toBeUndefined();
  });
});

describe("isTooManyRequests", () => {
  it("429만 5분 제한으로 본다", () => {
    expect(isTooManyRequests(new ApiError(429, undefined))).toBe(true);
    expect(isTooManyRequests(new ApiError(400, undefined))).toBe(false);
    expect(isTooManyRequests(new Error("x"))).toBe(false);
  });
});

describe("readResultFailure", () => {
  it("result가 true이고 사유가 없으면 성공(null)이다", () => {
    expect(readResultFailure({ result: true })).toBeNull();
  });

  it("정산 기간 거부는 result가 true여도 실패로 본다", () => {
    expect(readResultFailure({ result: true, reason: "denied" })).toBe(
      DENIED_REASON,
    );
  });

  it("result가 false면 사유를, 사유가 없으면 빈 문자열을 돌려준다", () => {
    expect(
      readResultFailure({ result: false, reason: "fail image upload" }),
    ).toBe("fail image upload");
    expect(readResultFailure({ result: false })).toBe("");
  });

  it("예상한 형태가 아니면 성공으로 보지 않는다", () => {
    expect(readResultFailure(undefined)).toBe("");
    expect(readResultFailure({ ok: true })).toBe("");
  });
});
