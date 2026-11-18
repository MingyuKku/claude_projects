import { transformBalance } from "./transform-balance";

describe("transformBalance", () => {
  it("bigbirdMoney를 보유 금액으로, withdrawable을 출금 가능 여부로 바꾼다", () => {
    expect(
      transformBalance({
        bigbirdMoney: 1250000,
        withdrawable: true,
        withdrawUnavailableReason: null,
      }),
    ).toEqual({ amount: 1250000, isWithdrawable: true });
  });

  it("출금할 수 없는 사유가 와도 출금 불가로만 바꾼다", () => {
    expect(
      transformBalance({
        bigbirdMoney: 0,
        withdrawable: false,
        withdrawUnavailableReason: "ZERO_BALANCE",
      }),
    ).toEqual({ amount: 0, isWithdrawable: false });
  });
});
