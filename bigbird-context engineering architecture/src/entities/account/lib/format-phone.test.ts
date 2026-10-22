import { formatPhoneNumber } from "./format-phone";

describe("formatPhoneNumber", () => {
  it("휴대폰 11자리와 10자리에 하이픈을 넣는다", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
    expect(formatPhoneNumber("0111234567")).toBe("011-123-4567");
  });

  it("서울 지역번호는 2자리로 끊는다", () => {
    expect(formatPhoneNumber("021234567")).toBe("02-123-4567");
    expect(formatPhoneNumber("0212345678")).toBe("02-1234-5678");
  });

  it("이미 하이픈이 있거나 길이를 모르면 그대로 둔다", () => {
    expect(formatPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
    expect(formatPhoneNumber("123")).toBe("123");
    expect(formatPhoneNumber("")).toBe("");
  });
});
