import { MAX_NUMBER_INPUT_DIGITS, parseNumberInput } from "./number-input";

describe("parseNumberInput", () => {
  it("숫자만 남기고 천 단위 구분이나 문자는 버린다", () => {
    expect(parseNumberInput("15,000")).toBe(15000);
    expect(parseNumberInput("1a2b3")).toBe(123);
    expect(parseNumberInput("₩ 500")).toBe(500);
  });

  it("비었거나 숫자가 없으면 null이다", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("abc")).toBeNull();
  });

  it("앞의 0은 버리고 0 자체는 0이다", () => {
    expect(parseNumberInput("0001500")).toBe(1500);
    expect(parseNumberInput("0")).toBe(0);
  });

  it("자릿수 상한까지만 받는다", () => {
    expect(parseNumberInput("1".repeat(MAX_NUMBER_INPUT_DIGITS + 3))).toBe(
      Number("1".repeat(MAX_NUMBER_INPUT_DIGITS)),
    );
  });
});
