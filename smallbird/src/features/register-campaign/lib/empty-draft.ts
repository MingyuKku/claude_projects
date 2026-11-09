import type { CampaignDraft } from "@/entities/campaign";

/** 사용자가 입력하는 1~6단계 값만 담은 조각. 7단계(약관)·가 본 단계·서버 값은 뺌. */
export type DraftInputs = Pick<
  CampaignDraft,
  "campaignInfo" | "product" | "influencer" | "addOns" | "intro" | "conditions"
>;

/** 아무것도 입력하지 않은 1~6단계. 입력 여부를 비교할 기준이자 값을 비울 때 쓰는 값. */
export function createEmptyInputs(): DraftInputs {
  return {
    campaignInfo: {
      name: null,
      campaignType: null,
      brandIdx: null,
      startDate: null,
      endDate: null,
    },
    product: createEmptyProduct(),
    influencer: { platform: null, gender: null, ageGroups: [], topics: [] },
    addOns: [],
    intro: {
      mode: null,
      sourceUrl: null,
      mainImage: null,
      media: [],
      description: null,
      notice: null,
      hashtags: [],
      aiJob: null,
    },
    conditions: {
      postingPeriodMonths: null,
      secondaryCopyright: null,
      headcount: null,
      rewardPerInfluencer: null,
    },
  };
}

export function createEmptyProduct(): CampaignDraft["product"] {
  return {
    productName: null,
    quantityPerInfluencer: null,
    productPrice: null,
    returnRequired: null,
    returnAddress: null,
    returnShippingFee: null,
    returnContact: null,
    rental: null,
    rentalReturnAddress: null,
    rentalReturnShippingFee: null,
    rentalReturnContact: null,
    storeName: null,
    storeAddress: null,
    visitCouponCode: null,
    visitBenefit: null,
    purchaseUrl: null,
    purchaseUrlVerified: null,
    purchasePrice: null,
    purchaseGuide: null,
  };
}
