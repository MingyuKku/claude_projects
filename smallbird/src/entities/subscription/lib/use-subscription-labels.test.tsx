import { renderHook } from "@testing-library/react";

import {
  usePaymentMethodLabel,
  useSubscriptionProductName,
} from "./use-subscription-labels";

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

describe("useSubscriptionProductName", () => {
  function name() {
    return renderHook(() => useSubscriptionProductName()).result.current;
  }

  it("상품 유형·결제 주기로 이름을 만든다", () => {
    expect(name()("recruit", "monthly", "서버 이름")).toBe(
      "월 구독 상품_모집형",
    );
    expect(name()("pick", "yearly", "서버 이름")).toBe("연 구독 상품_PICK형");
  });

  it("코드를 하나라도 모르면 서버 이름을 그대로 보인다", () => {
    expect(name()(null, "monthly", "월 구독 상품_모집형")).toBe(
      "월 구독 상품_모집형",
    );
    expect(name()("recruit", null, "서버 이름")).toBe("서버 이름");
  });
});
