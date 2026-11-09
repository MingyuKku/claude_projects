import { campaignDetailSchema, campaignDraftSchema } from "./schema";

const emptyDraft = {
  campaignIdx: 1,
  campaignCode: "PB12341234123",
  serviceType: "PICK",
  productType: "BRAND",
  status: "DRAFT",
  version: 1,
  visitedSteps: [],
  updatedAt: "2026-11-06 10:00:00",
  campaignInfo: {
    name: null,
    campaignType: null,
    brandIdx: null,
    startDate: null,
    endDate: null,
  },
  product: {
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
  },
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
  policy: {
    agreements: {
      service: false,
      privacy: false,
      operation: false,
      reward: false,
    },
  },
};

describe("campaignDraftSchema", () => {
  it("아무것도 입력하지 않은 초안(값은 null, 목록은 [])을 읽는다", () => {
    expect(campaignDraftSchema.parse(emptyDraft)).toEqual(emptyDraft);
  });

  it("파일의 썸네일 주소가 없으면 null로 채운다", () => {
    const draft = campaignDraftSchema.parse({
      ...emptyDraft,
      intro: {
        ...emptyDraft.intro,
        mainImage: {
          fileId: "f1",
          url: "https://cdn/f1.png",
          mediaType: "IMAGE",
          durationSec: null,
        },
      },
    });

    expect(draft.intro.mainImage?.thumbnailUrl).toBeNull();
  });

  it("목록에 없는 캠페인 유형 코드는 거절한다(사용자가 고르는 값이라 화면이 보내지 않음)", () => {
    const invalid = {
      ...emptyDraft,
      campaignInfo: { ...emptyDraft.campaignInfo, campaignType: "UNKNOWN" },
    };

    expect(campaignDraftSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("campaignDetailSchema", () => {
  const detail = {
    ...emptyDraft,
    status: "REJECTED",
    brand: { brandIdx: 3, nameKo: "빅", nameEn: "Big", imageUrl: null },
    rejections: [{ section: "PRODUCT", reason: "금액을 확인해주세요." }],
    reapprovalRemaining: 2,
    payment: {
      paidAmount: 10000,
      paidAt: "2026-11-06 10:00:00",
      method: "BIGBIRD_MONEY",
    },
    addOnPrices: [
      { code: "AI_POSTING_GUIDE", unitPrice: 10000, unit: "FIXED" },
    ],
    reviewedAt: null,
  };

  it("초안에 등록 내역 필드를 더해 읽는다", () => {
    expect(campaignDetailSchema.parse(detail).rejections).toEqual([
      { section: "PRODUCT", reason: "금액을 확인해주세요." },
    ]);
  });

  it("서버가 새 반려 섹션·부가서비스 코드를 보내도 화면을 깨뜨리지 않는다", () => {
    const parsed = campaignDetailSchema.parse({
      ...detail,
      rejections: [{ section: "NEW_SECTION", reason: "사유" }],
      addOnPrices: [{ code: "NEW_ADD_ON", unitPrice: 1, unit: "FIXED" }],
    });

    expect(parsed.rejections[0]?.section).toBe("NEW_SECTION");
  });

  it("결제 전 캠페인은 결제 정보와 브랜드가 없을 수 있다", () => {
    const parsed = campaignDetailSchema.parse({
      ...detail,
      status: "DRAFT",
      brand: null,
      payment: null,
    });

    expect(parsed.payment).toBeNull();
  });
});
