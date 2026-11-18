import { toChargeStatus } from "./charge-status";

describe("toChargeStatus", () => {
  it("서버 상태 코드를 화면용 코드로 바꾼다", () => {
    expect(toChargeStatus("DEPOSIT_COMPLETED")).toBe("paid");
    expect(toChargeStatus("WITHDRAWAL_COMPLETED")).toBe("withdrawn");
    expect(toChargeStatus("PENDING")).toBe("pending");
    expect(toChargeStatus("DEPOSIT_EXPIRED")).toBe("canceled");
  });

  it("모르는 값과 옛 한글 값은 null이다", () => {
    expect(toChargeStatus("WITHDRAWAL_REJECTED")).toBeNull();
    expect(toChargeStatus("결제완료")).toBeNull();
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
