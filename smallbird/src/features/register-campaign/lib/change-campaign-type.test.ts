import { changeCampaignType } from "./change-campaign-type";
import { createDraftFixture } from "./test-utils";

function draftOf(
  campaignType: "PRODUCT_DELIVERY" | "PURCHASE_REVIEW",
  headcount: number | null,
) {
  const base = createDraftFixture({ serviceType: "RECRUIT" });
  return createDraftFixture({
    serviceType: "RECRUIT",
    campaignInfo: { ...base.campaignInfo, name: "봄", campaignType },
    product: { ...base.product, productName: "세트", productPrice: 5000 },
    conditions: {
      postingPeriodMonths: 3,
      secondaryCopyright: true,
      headcount,
      rewardPerInfluencer: 1000,
    },
    addOns: ["AI_POSTING_GUIDE"],
  });
}

describe("changeCampaignType", () => {
  it("2단계 입력 전체와 리워드를 비우고 다른 단계는 유지한다", () => {
    const changed = changeCampaignType(
      draftOf("PRODUCT_DELIVERY", 5),
      "STORE_VISIT",
    );

    expect(changed.campaignInfo).toMatchObject({
      name: "봄",
      campaignType: "STORE_VISIT",
    });
    expect(changed.product.productName).toBeNull();
    expect(changed.product.productPrice).toBeNull();
    expect(changed.conditions).toMatchObject({
      rewardPerInfluencer: null,
      postingPeriodMonths: 3,
      secondaryCopyright: true,
      headcount: 5,
    });
    expect(changed.addOns).toEqual(["AI_POSTING_GUIDE"]);
  });

  it("구매리뷰형을 오가면 인원의 뜻이 달라져 비운다", () => {
    expect(
      changeCampaignType(draftOf("PRODUCT_DELIVERY", 5), "PURCHASE_REVIEW")
        .conditions.headcount,
    ).toBeNull();
    expect(
      changeCampaignType(draftOf("PURCHASE_REVIEW", 5), "PRESS").conditions
        .headcount,
    ).toBeNull();
  });

  it("같은 유형이면 그대로 돌려준다", () => {
    const draft = draftOf("PRODUCT_DELIVERY", 5);

    expect(changeCampaignType(draft, "PRODUCT_DELIVERY")).toBe(draft);
  });
});
