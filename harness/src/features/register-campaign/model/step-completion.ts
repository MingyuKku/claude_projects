import { isEqual } from "radash";
import { z } from "zod";

import { CAMPAIGN_TYPES, createEmptyDraft } from "@/entities/campaign";

import { applyDraftDefaults } from "./draft-defaults";

import type {
  CampaignDraft,
  CampaignDraftStep,
  CampaignPlatform,
} from "@/entities/campaign";

// 단계별 필수값 검사. 사이드바 표시(입력 중·미입력 경고)와 1단계 "다음", 결제 전 검사가 같은 규칙을 씀.
// 저장 여부와 관계없이 지금 초안 값으로 매번 계산함(스펙 §3 단계 사이드바).

/** 협찬제품 금액이 이 이상일 때만 대여 상품을 고를 수 있음(시안 주석). */
export const RENTAL_MIN_PRODUCT_PRICE = 1_000_000;
/** 방문 시 제공 혜택 및 수량 최대 글자 수. */
export const VISIT_BENEFIT_MAX_LENGTH = 300;
/** 소개서 캠페인 설명·유의사항 최대 글자 수. */
export const INTRO_TEXT_MAX_LENGTH = 1000;
/** 소개서 상세 이미지·동영상 최대 개수. */
export const DETAIL_MEDIA_MAX_COUNT = 5;
/** 포스팅 유지기간 직접 입력 범위(개월). */
export const POSTING_PERIOD_RANGE = { min: 1, max: 999 } as const;
/** 제목·본문 해시태그를 따로 받는 플랫폼. 그 밖은 본문 한 칸(REQ-10-0063~0065). */
export const TITLE_HASHTAG_PLATFORMS: readonly CampaignPlatform[] = [
  "NAVER_BLOG",
  "YOUTUBE",
];

const requiredText = z.string().trim().min(1);
const positiveAmount = z.number().int().min(1);
const addressSchema = z.object({
  zonecode: requiredText,
  address: requiredText,
});
const contactSchema = z.string().regex(/^[0-9-]+$/);
/** 숫자 4자리, 첫 자리 0 불가(서버가 숫자로 저장해 앞 0이 사라짐, API A-5.2). */
export const VISIT_COUPON_CODE_PATTERN = /^[1-9]\d{3}$/;

const infoSchema = z.object({
  name: requiredText,
  brandIdx: z.number(),
  campaignType: z.enum(CAMPAIGN_TYPES),
  startDate: z.string(),
});

const deliveryBaseSchema = z.object({
  productName: requiredText,
  quantityPerCreator: positiveAmount,
  productPrice: positiveAmount,
});
const returnSchema = z.object({
  returnAddress: addressSchema,
  returnShippingFee: positiveAmount,
  returnContact: contactSchema,
});
const rentalSchema = z.object({
  productPrice: z.number().min(RENTAL_MIN_PRODUCT_PRICE),
  rentalReturnAddress: addressSchema,
  rentalReturnShippingFee: positiveAmount,
  rentalReturnContact: contactSchema,
});
const storeVisitSchema = z.object({
  storeName: requiredText,
  storeAddress: addressSchema,
  visitCouponCode: z.string().regex(VISIT_COUPON_CODE_PATTERN),
  visitBenefit: requiredText.max(VISIT_BENEFIT_MAX_LENGTH),
});

function isProductComplete({ info, product }: CampaignDraft) {
  switch (info.campaignType) {
    case "PRODUCT_DELIVERY":
      return (
        deliveryBaseSchema.safeParse(product).success &&
        (!product.returnRequired || returnSchema.safeParse(product).success) &&
        (!product.rental || rentalSchema.safeParse(product).success)
      );
    case "STORE_VISIT":
      return storeVisitSchema.safeParse(product).success;
    case "PRESS":
      // 기자단형은 입력 칸이 없어 늘 통과함.
      return true;
    case null:
      return false;
  }
}

const creatorSchema = z.object({
  platform: z.string(),
  gender: z.string(),
  ageGroups: z.array(z.string()).min(1),
  topics: z.array(z.string()).min(1),
});

export function needsTitleHashtags(platform: CampaignPlatform | null) {
  return platform !== null && TITLE_HASHTAG_PLATFORMS.includes(platform);
}

const introSchema = z.object({
  mainImage: z.object({}),
  detailMedia: z.array(z.unknown()).min(1).max(DETAIL_MEDIA_MAX_COUNT),
  description: requiredText,
  notice: requiredText,
  contentHashtags: z.array(z.string()).min(1),
});

function isIntroComplete({ creator, intro }: CampaignDraft) {
  if (!introSchema.safeParse(intro).success) return false;
  return (
    !needsTitleHashtags(creator.platform) || intro.titleHashtags.length > 0
  );
}

const conditionsSchema = z.object({
  postingPeriodMonths: z
    .number()
    .int()
    .min(POSTING_PERIOD_RANGE.min)
    .max(POSTING_PERIOD_RANGE.max),
  secondaryCopyright: z.boolean(),
});

const STEP_CHECKERS: Record<
  CampaignDraftStep,
  (draft: CampaignDraft) => boolean
> = {
  info: ({ info }) => infoSchema.safeParse(info).success,
  product: isProductComplete,
  creator: ({ creator }) => creatorSchema.safeParse(creator).success,
  // 부가서비스는 선택사항이라 늘 통과함.
  addOns: () => true,
  intro: isIntroComplete,
  conditions: ({ conditions }) =>
    conditionsSchema.safeParse(conditions).success,
  policy: ({ policy }) => Object.values(policy).every(Boolean),
};

export function isStepComplete(step: CampaignDraftStep, draft: CampaignDraft) {
  return STEP_CHECKERS[step](draft);
}

// 기본 선택만 채워진 초안. 기본 선택은 사용자가 입력한 값이 아니라서 "입력을 시작함"의 기준으로 씀.
const EMPTY_DRAFT = applyDraftDefaults(createEmptyDraft());

/** 한 칸이라도 입력을 시작한 단계(기본 선택만 있는 초안과 다름). */
export function isStepStarted(step: CampaignDraftStep, draft: CampaignDraft) {
  return !isEqual(draft[step], EMPTY_DRAFT[step]);
}

/** 유형을 바꾸면 비우는 단계(2~7단계). */
const STEPS_RESET_BY_TYPE_CHANGE: readonly CampaignDraftStep[] = [
  "product",
  "creator",
  "addOns",
  "intro",
  "conditions",
  "policy",
];

/** 1~7단계에 입력한 값이 하나라도 있는지. 있을 때만 이전 캠페인 불러오기 덮어쓰기 알럿을 띄움(P-33 답 전 처리). */
export function hasAnyInput(draft: CampaignDraft) {
  return isStepStarted("info", draft) || hasInputAfterInfo(draft);
}

/** 2~7단계에 입력한 값이 하나라도 있는지. 있을 때만 유형 변경 확인 알럿을 띄움. */
export function hasInputAfterInfo(draft: CampaignDraft) {
  return STEPS_RESET_BY_TYPE_CHANGE.some((step) => isStepStarted(step, draft));
}
