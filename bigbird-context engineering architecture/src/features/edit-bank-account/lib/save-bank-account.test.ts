import { ApiError } from "@/shared/api";

import { saveBankAccount, uploadBankBook } from "../api/bank-api";
import { saveBankAccountWithBankBook } from "./save-bank-account";

vi.mock("../api/bank-api");

const values = { bankIdx: "1", accountNumber: "123", accountHolder: "홍길동" };
const pdf = new File(["x"], "bank.pdf");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(saveBankAccount).mockResolvedValue({ result: true });
  vi.mocked(uploadBankBook).mockResolvedValue({ result: true });
});

describe("saveBankAccountWithBankBook", () => {
  it("계좌를 저장한 뒤 고른 통장 사본을 올린다", async () => {
    const result = await saveBankAccountWithBankBook({ values, bankBook: pdf });
    expect(result).toEqual({ hasSavedInfo: true, failure: null, reason: "" });
    expect(uploadBankBook).toHaveBeenCalledWith(pdf);
  });

  it("통장 사본을 고르지 않으면 업로드하지 않는다", async () => {
    await saveBankAccountWithBankBook({ values, bankBook: null });
    expect(uploadBankBook).not.toHaveBeenCalled();
  });

  it("정산 기간 거부는 result가 true여도 denied 실패로 보고 업로드하지 않는다", async () => {
    vi.mocked(saveBankAccount).mockResolvedValue({
      result: true,
      reason: "denied",
    });
    const result = await saveBankAccountWithBankBook({ values, bankBook: pdf });
    expect(result).toEqual({
      hasSavedInfo: false,
      failure: "denied",
      reason: "denied",
    });
    expect(uploadBankBook).not.toHaveBeenCalled();
  });

  it("사유 없는 result false는 일반 실패다", async () => {
    vi.mocked(saveBankAccount).mockResolvedValue({ result: false });
    const result = await saveBankAccountWithBankBook({
      values,
      bankBook: null,
    });
    expect(result).toMatchObject({ hasSavedInfo: false, failure: "info" });
  });

  it("업로드가 실패하면 계좌는 저장된 상태로 bankBook 실패를 알린다", async () => {
    vi.mocked(uploadBankBook).mockRejectedValue(
      new ApiError(400, {
        result: false,
        reason: "extra information is not found",
      }),
    );
    const result = await saveBankAccountWithBankBook({ values, bankBook: pdf });
    expect(result).toEqual({
      hasSavedInfo: true,
      failure: "bankBook",
      reason: "extra information is not found",
    });
  });
});
