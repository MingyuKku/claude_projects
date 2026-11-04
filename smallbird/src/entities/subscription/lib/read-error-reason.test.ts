import { ApiError } from "@/shared/api";

import { readApiErrorPgMessage, readApiErrorReason } from "./read-error-reason";

const PG_FAILURE = {
  result: false,
  reason: "PAYMENT_FAILED",
  pgMessage: "잔액부족",
  pgCode: "1254",
};

describe("readApiErrorReason", () => {
  it("실패 응답의 에러 코드를 읽는다", () => {
    expect(readApiErrorReason(new ApiError(400, PG_FAILURE))).toBe(
      "PAYMENT_FAILED",
    );
  });

  it("API 오류가 아니거나 모양이 다르면 undefined다", () => {
    expect(readApiErrorReason(new Error("fail"))).toBeUndefined();
    expect(readApiErrorReason(new ApiError(500, "서버 오류"))).toBeUndefined();
  });
});

describe("readApiErrorPgMessage", () => {
  it("결제사가 준 거절 사유를 읽는다", () => {
    expect(readApiErrorPgMessage(new ApiError(400, PG_FAILURE))).toBe(
      "잔액부족",
    );
  });

  it("사유가 없거나 비어 있거나 문자열이 아니면 undefined다", () => {
    const withBody = (body: unknown) => new ApiError(400, body);
    expect(
      readApiErrorPgMessage(
        withBody({ result: false, reason: "PAYMENT_FAILED" }),
      ),
    ).toBeUndefined();
    expect(
      readApiErrorPgMessage(withBody({ ...PG_FAILURE, pgMessage: "" })),
    ).toBeUndefined();
    expect(
      readApiErrorPgMessage(withBody({ ...PG_FAILURE, pgMessage: "   " })),
    ).toBeUndefined();
    expect(
      readApiErrorPgMessage(withBody({ ...PG_FAILURE, pgMessage: null })),
    ).toBeUndefined();
    expect(
      readApiErrorPgMessage(withBody({ ...PG_FAILURE, pgMessage: 1254 })),
    ).toBeUndefined();
  });

  it("API 오류가 아니면 undefined다", () => {
    expect(readApiErrorPgMessage(new Error("fail"))).toBeUndefined();
  });
});
