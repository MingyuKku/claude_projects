import { transformCampaignDetail } from "./transform-campaign-detail";

import type { CampaignDetailResponse } from "../model/detail-schema";

function createResponse(): CampaignDetailResponse {
  return {
    campaignIdx: 1,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    demo: false,
    demoCompleted: false,
    info: {
      campaignCode: "PB-00000000000001",
      name: null,
      brandIdx: null,
      brandName: null,
      brandLogoUrl: null,
      campaignType: null,
      startDate: null,
      endDate: null,
    },
    product: {
      productName: null,
      quantityPerInfluencer: null,
      productPrice: null,
      returnRequired: false,
      returnAddress: null,
      returnShippingFee: null,
      returnContact: null,
      rental: false,
      rentalReturnAddress: null,
      rentalReturnShippingFee: null,
      rentalReturnContact: null,
      storeName: null,
      storeAddress: null,
      visitCouponCode: null,
      visitBenefit: null,
    },
    influencer: { platform: null, gender: null, ageGroups: [], topics: [] },
    addOns: [],
    intro: {
      mainImage: null,
      detailMedia: [],
      description: null,
      notice: null,
      titleHashtags: [],
      contentHashtags: [],
    },
    conditions: {
      headcount: null,
      rewardPerInfluencer: null,
      postingPeriodMonths: null,
      secondaryCopyright: null,
    },
  };
}

describe("transformCampaignDetail", () => {
  it("모르는 선택지 코드는 고르지 않은 것으로 보고, 모르는 유형은 원문을 남긴다", () => {
    const response = createResponse();
    response.status = "ARCHIVED";
    response.info.campaignType = "PURCHASE_REVIEW";
    response.influencer = {
      platform: "THREADS",
      gender: "OTHER",
      ageGroups: ["AGE_20S", "AGE_60S"],
      topics: ["Beauty", "Unknown"],
    };
    response.addOns = ["POSTING_GUIDE", "RECEIPT_REVIEW"];

    const detail = transformCampaignDetail(response);

    expect(detail.stage).toBeNull();
    expect(detail.rawStatus).toBe("ARCHIVED");
    expect(detail.draft.info.campaignType).toBeNull();
    expect(detail.rawCampaignType).toBe("PURCHASE_REVIEW");
    expect(detail.draft.creator).toEqual({
      platform: null,
      gender: null,
      ageGroups: ["AGE_20S"],
      topics: ["Beauty"],
    });
    expect(detail.draft.addOns).toEqual(["POSTING_GUIDE"]);
  });

  it("비어 있는 글자 칸은 빈 문자열, 아직 없는 정책 동의·결제는 기본값으로 읽는다", () => {
    const detail = transformCampaignDetail(createResponse());

    expect(detail.draft.info.name).toBe("");
    expect(detail.draft.product.returnContact).toBe("");
    expect(detail.draft.policy).toEqual({
      service: false,
      privacy: false,
      operation: false,
      reward: false,
    });
    expect(detail.payment).toBeNull();
    expect(detail.rejectReason).toBeNull();
    expect(detail.brand).toBeNull();
  });

  it("주소의 상세 주소가 없으면 빈 문자열로 읽는다", () => {
    const response = createResponse();
    response.product.storeAddress = {
      zonecode: "06236",
      address: "서울 강남구 테헤란로 1",
      detail: null,
    };

    const detail = transformCampaignDetail(response);

    expect(detail.draft.product.storeAddress).toEqual({
      zonecode: "06236",
      address: "서울 강남구 테헤란로 1",
      detail: "",
    });
  });
});
