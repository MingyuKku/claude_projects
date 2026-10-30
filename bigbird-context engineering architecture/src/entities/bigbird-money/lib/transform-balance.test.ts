import { transformBalance } from "./transform-balance";

describe("transformBalance", () => {
  it("bizMoney를 보유 금액으로 바꾼다", () => {
    expect(transformBalance({ bizMoney: 1250000 })).toEqual({
      amount: 1250000,
    });
  });
});
