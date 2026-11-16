import { toIsoDate } from "@/shared/lib";

import { getCampaignEndDate } from "../../model/period";

import type { CampaignDetailResponse } from "../../model/detail-schema";

// 캠페인 목 저장소의 한 행과 그 행을 만드는 도구. 저장소(campaign-db)와 시드(campaign-seeds)가 함께 씀.

type DetailResponse = CampaignDetailResponse;

export interface MockCampaignRecord {
  campaignIdx: number;
  campaignCode: string;
  serviceType: string;
  productType: string;
  status: string;
  demo: boolean;
  demoCompleted: boolean;
  rejectReason: string | null;
  /** 등록일 `yyyy-MM-dd HH:mm:ss`. */
  createdDate: string;
  info: Omit<
    DetailResponse["info"],
    "campaignCode" | "brandName" | "brandLogoUrl"
  >;
  /** 회수·대여 여부는 저장하지 않고 칸 값으로 계산함(A-3). */
  product: Omit<DetailResponse["product"], "returnRequired" | "rental">;
  influencer: DetailResponse["influencer"];
  addOns: string[];
  intro: DetailResponse["intro"];
  conditions: DetailResponse["conditions"];
  policy: {
    agreements: NonNullable<DetailResponse["policy"]>["agreements"];
  } | null;
  payment: { paidAmount: number; paidAt: string } | null;
}

/** 캠페인 코드 접두사(A-1): 모집형 브랜드형 BB · 모집형 공구형 CPO · PICK형 브랜드형 PB · PICK형 공구형 PO. */
const CODE_PREFIX: Record<string, string> = {
  "RECRUIT BRAND": "BB",
  "RECRUIT GROUP_BUY": "CPO",
  "PICK BRAND": "PB",
  "PICK GROUP_BUY": "PO",
};

export function toCampaignCode(
  serviceType: string,
  productType: string,
  campaignIdx: number,
) {
  const prefix = CODE_PREFIX[`${serviceType} ${productType}`] ?? "CMP";
  return `${prefix}-${String(campaignIdx).padStart(14, "0")}`;
}

/** 서버처럼 희망 시작일 + 30일(A-5.1). */
export const toEndDate = getCampaignEndDate;

export function toDateTime(date: Date) {
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return `${toIsoDate(date)} ${time}`;
}

export function createEmptyRecord(
  base: Pick<
    MockCampaignRecord,
    "campaignIdx" | "serviceType" | "productType" | "demo" | "createdDate"
  >,
): MockCampaignRecord {
  return {
    ...base,
    campaignCode: toCampaignCode(
      base.serviceType,
      base.productType,
      base.campaignIdx,
    ),
    status: "DRAFT",
    demoCompleted: false,
    rejectReason: null,
    info: {
      name: null,
      brandIdx: null,
      campaignType: null,
      startDate: null,
      endDate: null,
    },
    ...createEmptyInputs(),
    policy: null,
    payment: null,
  };
}

/** 2~6단계 빈 값. 유형을 바꾸면 서버가 이 값으로 비움(A-5.1). */
export function createEmptyInputs(): Pick<
  MockCampaignRecord,
  "product" | "influencer" | "addOns" | "intro" | "conditions"
> {
  return {
    product: {
      productName: null,
      quantityPerInfluencer: null,
      productPrice: null,
      returnAddress: null,
      returnShippingFee: null,
      returnContact: null,
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
