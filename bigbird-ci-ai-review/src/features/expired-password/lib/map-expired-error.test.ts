import { mapExpiredError, readExpiredErrorReason } from "./map-expired-error";

describe("mapExpiredError", () => {
  it.each([
    [
      "contains personal info",
      "개인 신상정보를 포함한 비밀번호는 사용을 금지합니다.",
    ],
    [
      "NEW PASSWORD AND CHECK PASSWORD CAN NOT BE DIFFERENCE.",
      "새 비밀번호와 확인 비밀번호는 다를 수 없습니다.",
    ],
    ["NOT REACHED SEMI ANNUAL.", "6개월이 지나지 않았습니다."],
    [
      "NEW PASSWORD CAN NOT BE SAME ORIGINAL PASSWORD.",
      "새 비밀번호는 원래 비밀번호와 같을 수 없습니다.",
    ],
    ["ORIGINAL PASSWORD INVALID.", "기존 비밀번호가 잘못되었습니다."],
    ["unknown", "에러가 발생하였습니다. 관리자에게 문의해주세요."],
    [undefined, "에러가 발생하였습니다. 관리자에게 문의해주세요."],
  ])("%s -> %s", (reason, expected) => {
    expect(mapExpiredError(reason)).toBe(expected);
  });
});

describe("readExpiredErrorReason", () => {
  it("reads the reason field", () => {
    expect(readExpiredErrorReason({ reason: "x" })).toBe("x");
  });

  it("returns undefined for unexpected bodies", () => {
    expect(readExpiredErrorReason(null)).toBeUndefined();
    expect(readExpiredErrorReason({ reason: 1 })).toBeUndefined();
  });
});
