import { parsePageParam } from "./page-param";

describe("parsePageParam", () => {
  it("1 이상의 정수는 그대로 쓴다", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("12")).toBe(12);
  });

  it("없거나 정수가 아니거나 0 이하면 1쪽이다", () => {
    for (const value of [
      null,
      "",
      "0",
      "-2",
      "2.5",
      "1e1",
      "0x10",
      "abc",
      " 3",
    ]) {
      expect(parsePageParam(value)).toBe(1);
    }
  });

  it("안전한 정수 범위를 넘으면 1쪽이다", () => {
    expect(parsePageParam("99999999999999999999")).toBe(1);
  });
});
