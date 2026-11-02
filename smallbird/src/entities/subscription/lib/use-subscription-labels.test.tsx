import { renderHook } from "@testing-library/react";

import { usePaymentMethodLabel } from "./use-subscription-labels";

describe("usePaymentMethodLabel", () => {
  function label() {
    return renderHook(() => usePaymentMethodLabel()).result.current;
  }

  it("체크카드로 결제한 일시불은 체크카드로 보인다", () => {
    expect(label()("card", "debit")).toBe("체크카드");
  });

  it("신용카드·종류를 모르는 경우는 기존 문구를 보인다", () => {
    expect(label()("card", "credit")).toBe("신용카드(일반)");
    expect(label()("card", null)).toBe("신용카드(일반)");
    expect(label()("card")).toBe("신용카드(일반)");
  });

  it("할부는 카드 종류와 관계없이 할부 문구를 보이고, 모르는 값은 서버 값을 그대로 보인다", () => {
    expect(label()("cardInstallment", "credit")).toBe("신용카드(할부)");
    expect(label()("virtualAccount", "debit")).toBe("virtualAccount");
    expect(label()("")).toBe("-");
  });
});
