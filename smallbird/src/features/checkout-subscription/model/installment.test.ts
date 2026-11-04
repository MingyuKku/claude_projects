import {
  canChooseInstallment,
  INSTALLMENT_OPTIONS,
  LUMP_SUM,
  toInstallmentMonths,
} from "./installment";

import type { BillingCard } from "@/entities/subscription";

const CARD: BillingCard = {
  id: "1",
  issuer: "하나카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
  cardKind: "credit",
};

describe("INSTALLMENT_OPTIONS", () => {
  it("일시불과 2~12개월이다", () => {
    expect(INSTALLMENT_OPTIONS).toEqual([
      LUMP_SUM,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]);
  });
});

describe("canChooseInstallment", () => {
  it("연간 결제의 신용카드는 고를 수 있다", () => {
    expect(canChooseInstallment("yearly", CARD)).toBe(true);
  });

  it("월간 결제는 고를 수 없다", () => {
    expect(canChooseInstallment("monthly", CARD)).toBe(false);
  });

  it("체크카드는 고를 수 없다", () => {
    expect(canChooseInstallment("yearly", { ...CARD, cardKind: "debit" })).toBe(
      false,
    );
  });

  it("카드 종류를 모르면 막지 않는다", () => {
    expect(canChooseInstallment("yearly", { ...CARD, cardKind: null })).toBe(
      true,
    );
  });

  it("카드가 없으면 고를 수 없다", () => {
    expect(canChooseInstallment("yearly", undefined)).toBe(false);
  });
});

describe("toInstallmentMonths", () => {
  it("일시불이면 보내지 않고 2개월부터는 그 값을 보낸다", () => {
    expect(toInstallmentMonths(LUMP_SUM)).toBeUndefined();
    expect(toInstallmentMonths(2)).toBe(2);
    expect(toInstallmentMonths(12)).toBe(12);
  });
});
