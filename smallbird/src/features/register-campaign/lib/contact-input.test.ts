import { sanitizeContactInput } from "./contact-input";

describe("sanitizeContactInput", () => {
  it("숫자와 하이픈만 남긴다", () => {
    expect(sanitizeContactInput("010-1234-5678")).toBe("010-1234-5678");
    expect(sanitizeContactInput("010 1234 5678")).toBe("01012345678");
    expect(sanitizeContactInput("tel: 02)123-4567")).toBe("02123-4567");
  });

  it("글자만 있으면 빈 문자열이다", () => {
    expect(sanitizeContactInput("문의 주세요")).toBe("");
  });
});
