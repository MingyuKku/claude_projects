// 캠페인 등록 화면 테스트용 서버 응답 데이터(상세 조회 A-3 응답, 브랜드 목록 A-6.1).

export type Json = Record<string, unknown>;

const EMPTY_PRODUCT = {
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
};

const EMPTY_INTRO = {
  mainImage: null,
  detailMedia: [],
  description: null,
  notice: null,
  titleHashtags: [],
  contentHashtags: [],
};

const IMAGE = {
  attachmentIdx: 1,
  url: "https://example.com/a.png",
  mediaType: "IMAGE",
};

/** 상세 조회(A-3) 응답. 넘긴 값으로 덮어씀. */
export function createDetailResponse(
  campaignIdx: number,
  patch: Json = {},
): Json {
  const { info, ...rest } = patch as { info?: Json };
  return {
    campaignIdx,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    demo: false,
    demoCompleted: false,
    rejectReason: null,
    info: {
      campaignCode: `PB-${String(campaignIdx).padStart(14, "0")}`,
      name: null,
      brandIdx: null,
      brandName: null,
      brandLogoUrl: null,
      campaignType: null,
      startDate: null,
      endDate: null,
      ...info,
    },
    product: EMPTY_PRODUCT,
    influencer: { platform: null, gender: null, ageGroups: [], topics: [] },
    groupBuyingConditions: null,
    addOns: [],
    intro: EMPTY_INTRO,
    conditions: {
      headcount: null,
      rewardPerInfluencer: null,
      postingPeriodMonths: null,
      secondaryCopyright: null,
    },
    policy: null,
    payment: null,
    ...rest,
  };
}

/** 1~6단계를 모두 채운 PICK형 브랜드형 캠페인 응답. 상태·정책 동의·결제는 넘긴 값으로 정함. */
export function createFilledDetailResponse(
  campaignIdx: number,
  patch: Json = {},
): Json {
  return createDetailResponse(campaignIdx, {
    info: {
      name: "초록숲 비건 스킨케어",
      brandIdx: 2,
      brandName: "초록숲",
      campaignType: "PRODUCT_DELIVERY",
      startDate: "2099-01-01",
      endDate: "2099-01-31",
    },
    product: {
      ...EMPTY_PRODUCT,
      productName: "앰플",
      quantityPerInfluencer: 1,
      productPrice: 30000,
    },
    influencer: {
      platform: "INSTAGRAM",
      gender: "FEMALE",
      ageGroups: ["AGE_20S"],
      topics: ["Beauty"],
    },
    intro: {
      ...EMPTY_INTRO,
      mainImage: IMAGE,
      detailMedia: [IMAGE],
      description: "설명",
      notice: "유의사항",
      contentHashtags: ["협찬"],
    },
    conditions: {
      headcount: null,
      rewardPerInfluencer: null,
      postingPeriodMonths: 1,
      secondaryCopyright: true,
    },
    ...patch,
  });
}

/** 브랜드 목록(A-6.1). 이미지는 없음. */
export const FAKE_BRANDS = [
  { brandIdx: 4, name: "비글로우", imageUrl: null },
  { brandIdx: 3, name: "빅링크 코스메틱", imageUrl: null },
  { brandIdx: 2, name: "초록숲", imageUrl: null },
  { brandIdx: 1, name: "데일리 스튜디오", imageUrl: null },
];
