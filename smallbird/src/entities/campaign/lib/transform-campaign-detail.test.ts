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
    groupBuyingConditions: null,
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

describe("transformCampaignDetail 공동구매 조건", () => {
  it("공구형의 공동구매 조건을 초안으로 읽고, 제품명·권장소비자가는 협찬 제품 정보와 따로 읽는다", () => {
    const response = createResponse();
    response.productType = "GROUP_BUY";
    response.product.productName = "신라호텔 숙박권";
    response.product.productPrice = 30000;
    response.groupBuyingConditions = {
      groupBuyingProductName: "신라호텔 1박",
      productCategoryIdx: 8,
      productMiddleCategoryIdx: 36,
      recommendedConsumerPrice: 60000,
      purchasePrice: 45000,
    };

    const { draft } = transformCampaignDetail(response);

    expect(draft.groupBuy).toEqual({
      productName: "신라호텔 1박",
      categoryIdx: 8,
      middleCategoryIdx: 36,
      recommendedPrice: 60000,
      price: 45000,
    });
    expect(draft.product.productName).toBe("신라호텔 숙박권");
    expect(draft.product.productPrice).toBe(30000);
  });

  it("브랜드형은 null이라 비어 있는 공동구매 조건으로 읽는다", () => {
    const { draft } = transformCampaignDetail(createResponse());

    expect(draft.groupBuy).toEqual({
      productName: "",
      categoryIdx: null,
      middleCategoryIdx: null,
      recommendedPrice: null,
      price: null,
    });
  });

  it("공구형은 고를 수 있는 주제 9개에 없는 서버 값을 선택하지 않은 것으로 읽는다", () => {
    const response = createResponse();
    response.productType = "GROUP_BUY";
    response.influencer.topics = ["Education", "Beauty", "All"];

    expect(transformCampaignDetail(response).draft.creator.topics).toEqual([
      "Beauty",
      "All",
    ]);

    response.productType = "BRAND";
    expect(transformCampaignDetail(response).draft.creator.topics).toEqual([
      "Education",
      "Beauty",
      "All",
    ]);
  });
});
