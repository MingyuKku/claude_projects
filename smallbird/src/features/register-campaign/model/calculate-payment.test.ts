import { createDraftFixture } from "../lib/test-utils";
import { calculatePayment } from "./calculate-payment";

import type { CampaignDraft } from "@/entities/campaign";

function draftOf(overrides: {
  serviceType: CampaignDraft["serviceType"];
  campaignType: NonNullable<CampaignDraft["campaignInfo"]["campaignType"]>;
  addOns?: CampaignDraft["addOns"];
  headcount?: number | null;
  reward?: number | null;
}): CampaignDraft {
  const base = createDraftFixture();
  return {
    ...base,
    serviceType: overrides.serviceType,
    addOns: overrides.addOns ?? [],
    campaignInfo: {
      ...base.campaignInfo,
      campaignType: overrides.campaignType,
    },
    conditions: {
      ...base.conditions,
      headcount: overrides.headcount ?? null,
      rewardPerInfluencer: overrides.reward ?? null,
    },
  };
}

describe("calculatePayment", () => {
  it("PICK형은 AI 포스팅 가이드 정액만 더하고 인원·리워드는 계산하지 않는다", () => {
    const summary = calculatePayment(
      draftOf({
        serviceType: "PICK",
        campaignType: "PRODUCT_DELIVERY",
        addOns: ["AI_POSTING_GUIDE"],
        headcount: 30,
        reward: 5_000,
      }),
    );

    expect(summary.total).toBe(10_000);
    expect(summary.addOns).toEqual([
      {
        code: "AI_POSTING_GUIDE",
        unit: "TOTAL",
        unitPrice: 10_000,
        quantity: 1,
        amount: 10_000,
      },
    ]);
    expect(summary.hasReward).toBe(false);
    expect(summary.rewardTotal).toBe(0);
  });

  it("부가서비스를 고르지 않은 PICK형은 0원이다", () => {
    expect(
      calculatePayment(draftOf({ serviceType: "PICK", campaignType: "PRESS" }))
        .total,
    ).toBe(0);
  });

  it("모집형은 인원당 부가서비스를 진행 인원만큼 곱한다(시안 예시: 5,000원 × 400명)", () => {
    const summary = calculatePayment(
      draftOf({
        serviceType: "RECRUIT",
        campaignType: "PRESS",
        addOns: ["AI_MANUSCRIPT_CONFIRM"],
        headcount: 400,
      }),
    );

    expect(summary.addOnTotal).toBe(2_000_000);
    expect(summary.total).toBe(2_000_000);
  });

  it("모집형 제품발송형은 부가서비스 합에 리워드 총액을 더한다", () => {
    const summary = calculatePayment(
      draftOf({
        serviceType: "RECRUIT",
        campaignType: "PRODUCT_DELIVERY",
        addOns: ["AI_POSTING_GUIDE", "AI_MANUSCRIPT_CONFIRM"],
        headcount: 20,
        reward: 10_000,
      }),
    );

    expect(summary.addOnTotal).toBe(10_000 + 5_000 * 20);
    expect(summary.hasReward).toBe(true);
    expect(summary.rewardTotal).toBe(200_000);
    expect(summary.total).toBe(110_000 + 200_000);
  });

  it("모집형 구매리뷰형도 리워드가 있고 기자단형·매장방문형은 없다", () => {
    const reviewed = calculatePayment(
      draftOf({
        serviceType: "RECRUIT",
        campaignType: "PURCHASE_REVIEW",
        headcount: 10,
        reward: 1_000,
      }),
    );
    const press = calculatePayment(
      draftOf({
        serviceType: "RECRUIT",
        campaignType: "PRESS",
        headcount: 10,
        reward: 1_000,
      }),
    );

    expect(reviewed.total).toBe(10_000);
    expect(press.hasReward).toBe(false);
    expect(press.total).toBe(0);
  });

  it("비어 있는 인원·리워드는 0으로 보고 계산한다", () => {
    const summary = calculatePayment(
      draftOf({
        serviceType: "RECRUIT",
        campaignType: "PRODUCT_DELIVERY",
        addOns: ["AI_RECEIPT_REVIEW"],
      }),
    );

    expect(summary.headcount).toBe(0);
    expect(summary.total).toBe(0);
  });
});
