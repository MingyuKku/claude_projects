import { ApiError } from "@/shared/api";

import { classifyWithdrawError } from "./withdraw-error";

function failure(status: number, reason?: string) {
  return new ApiError(status, { result: false, reason });
}

describe("classifyWithdrawError", () => {
  it.each([
    ["INVALID_BANK", "bank", "invalidBank"],
    ["INVALID_ACCOUNT_NUMBER", "accountNumber", "invalidAccountNumber"],
    ["INVALID_ACCOUNT_HOLDER", "accountHolder", "invalidAccountHolder"],
    ["BANK_BOOK_REQUIRED", "bankBook", "bankBookRequired"],
    ["INVALID_BANK_BOOK_FILE", "bankBook", "fileExtension"],
  ])("400 %s는 해당 입력 칸 오류다", (reason, field, error) => {
    expect(classifyWithdrawError(failure(400, reason))).toEqual({
      kind: "field",
      field,
      error,
    });
  });

  it("409 reason을 종류별로 나눈다", () => {
    expect(classifyWithdrawError(failure(409, "ZERO_BALANCE")).kind).toBe(
      "zeroBalance",
    );
    expect(
      classifyWithdrawError(failure(409, "PENDING_WITHDRAWAL_EXISTS")).kind,
    ).toBe("pending");
    expect(classifyWithdrawError(failure(409, "BALANCE_CHANGED")).kind).toBe(
      "balanceChanged",
    );
  });

  it("403·500·네트워크 오류·모르는 reason은 unknown이다", () => {
    expect(classifyWithdrawError(failure(403)).kind).toBe("unknown");
    expect(classifyWithdrawError(failure(500, "UPLOAD_FAILED")).kind).toBe(
      "unknown",
    );
    expect(classifyWithdrawError(new TypeError("Failed to fetch")).kind).toBe(
      "unknown",
    );
  });
});
