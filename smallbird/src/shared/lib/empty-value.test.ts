import { EMPTY_VALUE, orEmptyValue } from "./empty-value";

describe("orEmptyValue", () => {
  it("null·undefined·빈 문자열·공백뿐인 값은 빈 값 표시로 바꾼다", () => {
    expect(orEmptyValue(null)).toBe(EMPTY_VALUE);
    expect(orEmptyValue(undefined)).toBe(EMPTY_VALUE);
    expect(orEmptyValue("")).toBe(EMPTY_VALUE);
    expect(orEmptyValue("  ")).toBe(EMPTY_VALUE);
  });

  it("값이 있으면 그대로 돌려준다", () => {
    expect(orEmptyValue("국민은행")).toBe("국민은행");
    expect(orEmptyValue("0")).toBe("0");
  });
});
