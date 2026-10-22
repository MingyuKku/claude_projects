import { bankAccountResponseSchema } from "../model/schema";
import { transformBankAccountToViewModel } from "./transform-bank-account";

describe("transformBankAccountToViewModel", () => {
  it("등록된 계좌를 뷰모델로 옮긴다", () => {
    const response = bankAccountResponseSchema.parse({
      result: true,
      bank: "신한은행",
      accountNumber: "110-123-456789",
      accountHolder: "홍길동",
      isExistsBankBookFile: true,
    });
    expect(transformBankAccountToViewModel(response)).toEqual({
      bankName: "신한은행",
      accountNumber: "110-123-456789",
      accountHolder: "홍길동",
      hasBankBookFile: true,
    });
  });

  it("미등록 응답(result false)은 null이다", () => {
    const response = bankAccountResponseSchema.parse({
      result: false,
      reason: "error",
    });
    expect(transformBankAccountToViewModel(response)).toBeNull();
  });
});
