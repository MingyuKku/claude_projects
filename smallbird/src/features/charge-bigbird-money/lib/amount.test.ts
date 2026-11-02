import { addAmount, getAmountError, isChargeable, parseAmount } from "./amount";

describe("parseAmount", () => {
  it("숫자만 남기고 천 단위 구분이나 문자는 버린다", () => {
    expect(parseAmount("15,000")).toBe(15000);
    expect(parseAmount("1a2b3")).toBe(123);
  });

  it("비었거나 0이면 입력 없음이다", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("000")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("앞의 0은 버리고 자릿수 상한까지만 받는다", () => {
    expect(parseAmount("0001500")).toBe(1500);
    expect(parseAmount("12345678901")).toBe(123456789);
  });
});

describe("addAmount", () => {
  it("입력값에 더한다", () => {
    expect(addAmount(null, 10000)).toBe(10000);
    expect(addAmount(20000, 30000)).toBe(50000);
  });

  it("한도를 넘어도 그대로 더하고 입력 상한만 넘지 않는다", () => {
    expect(addAmount(950000, 100000)).toBe(1050000);
    expect(addAmount(999999990, 100000)).toBe(999999999);
  });
});

describe("getAmountError·isChargeable", () => {
  it("입력이 없으면 오류도 충전도 아니다", () => {
    expect(getAmountError(null)).toBeNull();
    expect(isChargeable(null)).toBe(false);
  });

  it("최소 미만과 한도 초과는 오류이고 충전할 수 없다", () => {
    expect(getAmountError(999)).toBe("min");
    expect(getAmountError(1_000_001)).toBe("max");
    expect(isChargeable(999)).toBe(false);
    expect(isChargeable(1_000_001)).toBe(false);
  });

  it("경계값과 1원 단위는 충전할 수 있다", () => {
    expect(isChargeable(1000)).toBe(true);
    expect(isChargeable(15500)).toBe(true);
    expect(isChargeable(1_000_000)).toBe(true);
  });
});
