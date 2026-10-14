import { mapChangeError, readChangeErrorMessage } from "./map-change-error";

describe("mapChangeError", () => {
  it.each([
    [
      "contains id",
      "사용자 아이디와 동일하거나 이를 포함한 비밀번호는 사용을 금지합니다",
    ],
    [
      "contains personal info",
      "개인 신상정보를 포함한 비밀번호는 사용을 금지합니다",
    ],
    [
      "time out",
      "비밀번호 변경에 실패하였습니다(5분 내에 비밀번호를 바꿔주세요)",
    ],
    ["something else", "비밀번호 변경에 실패하였습니다"],
    [undefined, "비밀번호 변경에 실패하였습니다"],
  ])("%s -> %s", (message, expected) => {
    expect(mapChangeError(message)).toBe(expected);
  });
});

describe("readChangeErrorMessage", () => {
  it("reads the message field", () => {
    expect(readChangeErrorMessage({ message: "time out" })).toBe("time out");
  });

  it("returns undefined for unexpected bodies", () => {
    expect(readChangeErrorMessage("oops")).toBeUndefined();
    expect(readChangeErrorMessage(undefined)).toBeUndefined();
    expect(readChangeErrorMessage({ message: 1 })).toBeUndefined();
  });
});
