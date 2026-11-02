import { toChargeStatus } from "./charge-status";

describe("toChargeStatus", () => {
  it("서버의 한글 입금 상태를 코드로 바꾼다", () => {
    expect(toChargeStatus("결제완료")).toBe("paid");
    expect(toChargeStatus("대기중")).toBe("pending");
    expect(toChargeStatus("결제취소")).toBe("canceled");
  });

  it("모르는 값은 null이다", () => {
    expect(toChargeStatus("입금완료")).toBeNull();
    expect(toChargeStatus("")).toBeNull();
  });

  it("객체 프로토타입 이름은 모르는 값으로 본다", () => {
    for (const name of [
      "constructor",
      "toString",
      "__proto__",
      "hasOwnProperty",
    ]) {
      expect(toChargeStatus(name)).toBeNull();
    }
  });
});
