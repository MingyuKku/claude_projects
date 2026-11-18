import {
  isWithdrawFormComplete,
  sanitizeAccountNumber,
  toWithdrawBody,
} from "./withdraw-form";

const file = new File(["x"], "통장.pdf", { type: "application/pdf" });
const filled = { bankIdx: "3", accountNumber: "1234", accountHolder: "홍길동" };

describe("isWithdrawFormComplete", () => {
  it("은행·계좌번호·예금주 명·통장 사본이 모두 있어야 한다", () => {
    expect(isWithdrawFormComplete(filled, file)).toBe(true);
    expect(isWithdrawFormComplete({ ...filled, bankIdx: "" }, file)).toBe(
      false,
    );
    expect(isWithdrawFormComplete({ ...filled, accountNumber: "" }, file)).toBe(
      false,
    );
    expect(isWithdrawFormComplete(filled, null)).toBe(false);
  });

  it("공백만 있는 예금주 명은 빈 값이다", () => {
    expect(
      isWithdrawFormComplete({ ...filled, accountHolder: "   " }, file),
    ).toBe(false);
  });
});

describe("sanitizeAccountNumber", () => {
  it("숫자만 남긴다", () => {
    expect(sanitizeAccountNumber("110-123 45a6")).toBe("11012345" + "6");
  });
});

describe("toWithdrawBody", () => {
  it("은행은 숫자 idx로, 예금주는 앞뒤 공백을 지워 보낸다", () => {
    expect(
      toWithdrawBody({ ...filled, accountHolder: " 홍길동 " }, 800000),
    ).toEqual({
      bankIdx: 3,
      accountNumber: "1234",
      accountHolder: "홍길동",
      amount: 800000,
    });
  });
});
