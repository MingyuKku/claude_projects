import { createMockStore } from "@/shared/lib";

import type {
  CampaignPlatform,
  CampaignProductType,
  CampaignServiceType,
  CampaignType,
} from "../../model/codes";
import type { CampaignDetail } from "../../model/schema";

// 캠페인 등록 API가 나오기 전 개발 서버에서 쓰는 목 데이터베이스. 캠페인마다 등록 내역(A-13) 한 건을 그대로 둠.
// 개발 서버(`import.meta.env.DEV`)에서만 불러오므로 stage·prod 번들에는 들어가지 않음.

export interface CampaignMockDb {
  nextCampaignIdx: number;
  campaigns: Record<string, CampaignDetail>;
}

export const campaignMockDb = createMockStore<CampaignMockDb>(
  "bigbird:mock:campaigns",
  () => ({ nextCampaignIdx: 1001, campaigns: createSeedCampaigns() }),
);

/** 목 캠페인 코드. 형식은 서버가 정하므로(요구 명세 Q-2) 시안 예시를 따라 "PB"/"RC" + 숫자 11자리로 만듦. */
export function createCampaignCode(
  serviceType: CampaignServiceType,
  campaignIdx: number,
) {
  const prefix = serviceType === "PICK" ? "PB" : "RC";
  return `${prefix}${String(campaignIdx).padStart(11, "0")}`;
}

/** 아무것도 입력하지 않은 등록 중 캠페인(A-1 응답). */
export function createEmptyCampaign(input: {
  campaignIdx: number;
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  now: string;
}): CampaignDetail {
  return {
    campaignIdx: input.campaignIdx,
    campaignCode: createCampaignCode(input.serviceType, input.campaignIdx),
    serviceType: input.serviceType,
    productType: input.productType,
    status: "DRAFT",
    version: 1,
    visitedSteps: [],
    updatedAt: input.now,
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
    brand: null,
    rejections: [],
    reapprovalRemaining: 2,
    payment: null,
    addOnPrices: [],
    reviewedAt: null,
  };
}

interface SeedInput {
  campaignIdx: number;
  serviceType: CampaignServiceType;
  name: string;
  brandIdx: number;
  campaignType: CampaignType;
  platform: CampaignPlatform;
  createdAt: string;
}

function createSeedCampaign(input: SeedInput): CampaignDetail {
  const base = createEmptyCampaign({
    campaignIdx: input.campaignIdx,
    serviceType: input.serviceType,
    productType: "BRAND",
    now: input.createdAt,
  });
  const isRecruit = input.serviceType === "RECRUIT";
  const isProduct = input.campaignType === "PRODUCT_DELIVERY";
  return {
    ...base,
    status: "APPROVED",
    visitedSteps: [
      "CAMPAIGN_INFO",
      "PRODUCT",
      "INFLUENCER",
      "ADD_ONS",
      "INTRO",
      "CONDITIONS",
      "POLICY",
      "PAYMENT",
    ],
    campaignInfo: {
      name: input.name,
      campaignType: input.campaignType,
      brandIdx: input.brandIdx,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
    },
    product: {
      ...base.product,
      productName: isProduct ? "봄 신제품 세트" : null,
      quantityPerInfluencer: isProduct ? 1 : null,
      productPrice: isProduct ? 45000 : null,
      returnRequired: isProduct ? false : null,
      rental: isProduct ? false : null,
    },
    influencer: {
      platform: input.platform,
      gender: "ALL",
      ageGroups: ["AGE_20S", "AGE_30S"],
      topics: ["BEAUTY"],
    },
    addOns: ["AI_POSTING_GUIDE"],
    intro: {
      ...base.intro,
      mode: "MANUAL",
      description: "이전 캠페인에서 작성한 설명입니다.",
      notice: "이전 캠페인에서 작성한 유의사항입니다.",
      hashtags: ["신제품", "체험단"],
    },
    conditions: {
      postingPeriodMonths: 3,
      secondaryCopyright: false,
      headcount: isRecruit ? 10 : null,
      rewardPerInfluencer: isRecruit && isProduct ? 10000 : null,
    },
    policy: {
      agreements: {
        service: true,
        privacy: true,
        operation: true,
        reward: true,
      },
    },
    payment: {
      paidAmount: 10000,
      paidAt: input.createdAt,
      method: "BIGBIRD_MONEY",
    },
  };
}

/** 이전 캠페인 불러오기 목록에 보일 승인 완료 캠페인(브랜드는 `entities/brand` 목의 1~3번). */
function createSeedCampaigns(): Record<string, CampaignDetail> {
  const seeds: SeedInput[] = [
    {
      campaignIdx: 901,
      serviceType: "PICK",
      name: "봄 신제품 체험",
      brandIdx: 3,
      campaignType: "PRODUCT_DELIVERY",
      platform: "INSTAGRAM",
      createdAt: "2026-02-02 10:00:00",
    },
    {
      campaignIdx: 902,
      serviceType: "PICK",
      name: "매장 오픈 이벤트",
      brandIdx: 2,
      campaignType: "STORE_VISIT",
      platform: "NAVER_BLOG",
      createdAt: "2026-03-14 14:20:00",
    },
    {
      campaignIdx: 903,
      serviceType: "PICK",
      name: "신상 구매 리뷰",
      brandIdx: 1,
      campaignType: "PURCHASE_REVIEW",
      platform: "YOUTUBE",
      createdAt: "2026-05-21 09:10:00",
    },
    {
      campaignIdx: 904,
      serviceType: "RECRUIT",
      name: "여름 시즌 체험단",
      brandIdx: 3,
      campaignType: "PRODUCT_DELIVERY",
      platform: "INSTAGRAM",
      createdAt: "2026-06-30 16:45:00",
    },
    {
      campaignIdx: 905,
      serviceType: "RECRUIT",
      name: "가을 기자단 모집",
      brandIdx: 2,
      campaignType: "PRESS",
      platform: "TIKTOK",
      createdAt: "2026-09-08 11:30:00",
    },
  ];
  return Object.fromEntries(
    seeds.map((seed) => [seed.campaignIdx, createSeedCampaign(seed)]),
  );
}
