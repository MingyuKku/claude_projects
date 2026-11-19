import { addVat, calculateCampaignPayment } from "./payment-amount";

import type { CampaignPaymentInput } from "./payment-amount";

const PICK: CampaignPaymentInput = {
  serviceType: "PICK",
  addOns: [],
  headcount: null,
  rewardPerCreator: null,
};

describe("addVat", () => {
  it("공급가에 10%를 더하고 소수점은 버린다", () => {
    expect(addVat(10_000)).toBe(11_000);
    expect(addVat(15)).toBe(16);
    expect(addVat(0)).toBe(0);
  });
});

describe("calculateCampaignPayment", () => {
  it("PICK형은 포스팅가이드 11,000원(부가세 포함)만 결제하고 원고컨펌은 넣지 않는다", () => {
    const payment = calculateCampaignPayment({
      ...PICK,
      addOns: ["POSTING_GUIDE", "MANUSCRIPT_CONFIRM"],
    });

    expect(payment).toEqual({
      addOnItems: [{ addOn: "POSTING_GUIDE", amount: 11_000 }],
      rewardAmount: null,
      totalAmount: 11_000,
    });
  });

  it("PICK형이 포스팅가이드를 고르지 않으면 0원이다", () => {
    expect(
      calculateCampaignPayment({ ...PICK, addOns: ["MANUSCRIPT_CONFIRM"] })
        .totalAmount,
    ).toBe(0);
  });

  it("모집형은 줄마다 부가세를 더한 포스팅가이드·원고컨펌·리워드의 합이다", () => {
    const payment = calculateCampaignPayment({
      serviceType: "RECRUIT",
      addOns: ["POSTING_GUIDE", "MANUSCRIPT_CONFIRM"],
      headcount: 10,
      rewardPerCreator: 20_000,
    });

    expect(payment.addOnItems).toEqual([
      { addOn: "POSTING_GUIDE", amount: 11_000 },
      { addOn: "MANUSCRIPT_CONFIRM", amount: 55_000 },
    ]);
    expect(payment.rewardAmount).toBe(220_000);
    expect(payment.totalAmount).toBe(286_000);
  });
});
