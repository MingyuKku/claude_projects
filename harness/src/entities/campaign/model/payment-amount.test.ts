import { calculateCampaignPayment } from "./payment-amount";

import type { CampaignPaymentInput } from "./payment-amount";

const PICK: CampaignPaymentInput = {
  serviceType: "PICK",
  campaignType: "PRODUCT_DELIVERY",
  addOns: [],
  headcount: null,
  rewardPerInfluencer: null,
};

describe("calculateCampaignPayment", () => {
  it("PICK형은 AI 포스팅 가이드 10,000원만 결제하고 원고컨펌은 넣지 않는다", () => {
    const payment = calculateCampaignPayment({
      ...PICK,
      addOns: ["POSTING_GUIDE", "MANUSCRIPT_CONFIRM"],
    });

    expect(payment).toEqual({
      addOnItems: [{ addOn: "POSTING_GUIDE", amount: 10_000 }],
      rewardAmount: null,
      totalAmount: 10_000,
    });
  });

  it("PICK형이 AI 포스팅 가이드를 고르지 않으면 0원이다", () => {
    expect(
      calculateCampaignPayment({ ...PICK, addOns: ["MANUSCRIPT_CONFIRM"] })
        .totalAmount,
    ).toBe(0);
  });

  it("모집형 제품발송형은 원고컨펌 인원당 5,000원과 리워드 총액을 더한다", () => {
    const payment = calculateCampaignPayment({
      serviceType: "RECRUIT",
      campaignType: "PRODUCT_DELIVERY",
      addOns: ["POSTING_GUIDE", "MANUSCRIPT_CONFIRM"],
      headcount: 20,
      rewardPerInfluencer: 30_000,
    });

    expect(payment.addOnItems).toEqual([
      { addOn: "POSTING_GUIDE", amount: 10_000 },
      { addOn: "MANUSCRIPT_CONFIRM", amount: 100_000 },
    ]);
    expect(payment.rewardAmount).toBe(600_000);
    expect(payment.totalAmount).toBe(710_000);
  });
});
