import { z } from "zod";

import {
  CAMPAIGN_ADD_ONS,
  CAMPAIGN_AGE_GROUPS,
  CAMPAIGN_GENDERS,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_TOPICS,
  CAMPAIGN_TYPES,
  INTRO_MODES,
} from "@/entities/campaign";

import {
  INTRO_MEDIA_MAX_COUNT,
  INTRO_MEDIA_MIN_COUNT,
  INTRO_TEXT_MAX_LENGTH,
  PRODUCT_TEXT_MAX_LENGTH,
  RENTAL_MIN_PRODUCT_PRICE,
} from "./constants";

import type { CampaignDraft } from "@/entities/campaign";

// 단계마다 "다음"을 누를 때 검사하는 Zod 스키마. 입력은 초안 전체이고, 값이나 유형에 따라 필요한 칸이 달라지므로 초안을 받아 스키마를 만듦.
// 사이드바의 완료·미완 표시도 같은 스키마로 매번 검사해 정함(저장된 값이 아님).

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 연락처는 숫자와 하이픈만, 숫자가 하나는 있어야 함. */
const CONTACT = /^[0-9-]*[0-9][0-9-]*$/;

const text = z.string().trim().min(1);
const positiveInt = z.number().int().min(1);
const address = z.object({
  zonecode: z.string(),
  address: text,
  detail: z.string(),
});
const contact = z.string().trim().regex(CONTACT);

export function createCampaignInfoSchema() {
  return z.object({
    campaignInfo: z.object({
      name: text,
      campaignType: z.enum(CAMPAIGN_TYPES),
      brandIdx: z.number().int(),
      startDate: z.string().regex(ISO_DATE),
    }),
  });
}

function createProductFields(draft: CampaignDraft) {
  const { product } = draft;
  switch (draft.campaignInfo.campaignType) {
    case "PRODUCT_DELIVERY":
      return {
        productName: text,
        quantityPerInfluencer: positiveInt,
        productPrice: positiveInt.min(
          product.rental ? RENTAL_MIN_PRODUCT_PRICE : 1,
        ),
        ...(product.returnRequired
          ? {
              returnAddress: address,
              returnShippingFee: positiveInt,
              returnContact: contact,
            }
          : {}),
        ...(product.rental
          ? {
              rentalReturnAddress: address,
              rentalReturnShippingFee: positiveInt,
              rentalReturnContact: contact,
            }
          : {}),
      };
    case "STORE_VISIT":
      return {
        storeName: text,
        storeAddress: address,
        visitCouponCode: text,
        visitBenefit: text.max(PRODUCT_TEXT_MAX_LENGTH),
      };
    case "PURCHASE_REVIEW":
      return {
        productName: text,
        purchaseUrl: text,
        // URL 확인을 통과해야 함. 주소를 고치면 확인 결과가 지워짐.
        purchaseUrlVerified: z.literal(true),
        purchaseGuide: text.max(PRODUCT_TEXT_MAX_LENGTH),
        ...(draft.serviceType === "RECRUIT"
          ? { purchasePrice: positiveInt }
          : {}),
      };
    case "PRESS":
      // 기자단형은 입력할 것이 없음.
      return {};
    default:
      // 유형을 아직 고르지 않았으면 2단계를 마칠 수 없음.
      return { productName: z.never() };
  }
}

export function createProductSchema(draft: CampaignDraft) {
  return z.object({ product: z.object(createProductFields(draft)) });
}

export function createInfluencerSchema() {
  return z.object({
    influencer: z.object({
      platform: z.enum(CAMPAIGN_PLATFORMS),
      gender: z.enum(CAMPAIGN_GENDERS),
      ageGroups: z.array(z.enum(CAMPAIGN_AGE_GROUPS)).min(1),
      topics: z.array(z.enum(CAMPAIGN_TOPICS)).min(1),
    }),
  });
}

/** PICK형은 AI 포스팅 가이드 하나뿐이고, 고르지 않아도 통과함(부가서비스는 선택). */
export function createAddOnsSchema(draft: CampaignDraft) {
  const allowed =
    draft.serviceType === "PICK"
      ? z.enum(["AI_POSTING_GUIDE"])
      : z.enum(CAMPAIGN_ADD_ONS);
  return z.object({ addOns: z.array(allowed) });
}

/**
 * 직접 작성과 AI 생성 모두 같은 칸을 채워야 통과함(AI는 결과가 칸에 채워짐). AI 생성이 진행 중이면 아직 끝나지 않은 것임.
 * 설명·유의사항 상한은 직접 작성도 AI 결과와 같은 1000자.
 */
export function createIntroSchema() {
  return z.object({
    intro: z.object({
      mode: z.enum(INTRO_MODES),
      mainImage: z.object({ fileId: z.string() }),
      media: z
        .array(z.object({ fileId: z.string() }))
        .min(INTRO_MEDIA_MIN_COUNT)
        .max(INTRO_MEDIA_MAX_COUNT),
      description: text.max(INTRO_TEXT_MAX_LENGTH),
      notice: text.max(INTRO_TEXT_MAX_LENGTH),
      hashtags: z
        .array(text)
        .min(1)
        .refine((tags) => new Set(tags).size === tags.length),
      aiJob: z.object({ status: z.enum(["DONE", "FAILED"]) }).nullable(),
    }),
  });
}

/**
 * 6단계. 서비스 유형·캠페인 유형에 따라 칸이 다름.
 * - 진행 인원(모집형 구매리뷰형은 모집 인원)은 모집형에만 있고, 유지기간·2차 저작권은 구매리뷰형에는 없음.
 * - 리워드는 모집형 제품발송형·구매리뷰형에만 있고 상한은 상품 금액(협찬제품 금액, 구매제품 금액).
 * - PICK형 구매리뷰형은 입력할 것이 없음.
 */
export function createConditionsSchema(draft: CampaignDraft) {
  const isRecruit = draft.serviceType === "RECRUIT";
  const { campaignType } = draft.campaignInfo;
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";
  const rewardLimit = isPurchaseReview
    ? draft.product.purchasePrice
    : draft.product.productPrice;
  const hasReward =
    isRecruit && (campaignType === "PRODUCT_DELIVERY" || isPurchaseReview);

  return z.object({
    conditions: z.object({
      ...(isRecruit ? { headcount: positiveInt } : {}),
      ...(isPurchaseReview
        ? {}
        : {
            postingPeriodMonths: positiveInt,
            secondaryCopyright: z.boolean(),
          }),
      ...(hasReward
        ? { rewardPerInfluencer: positiveInt.max(rewardLimit ?? 0) }
        : {}),
    }),
  });
}

export function createPolicySchema() {
  return z.object({
    policy: z.object({
      agreements: z.object({
        service: z.literal(true),
        privacy: z.literal(true),
        operation: z.literal(true),
        reward: z.literal(true),
      }),
    }),
  });
}

/** 8단계는 직접 입력하는 값이 없어 항상 통과함. 결제하기가 모든 단계를 따로 검사함. */
export function createPaymentSchema() {
  return z.unknown();
}
