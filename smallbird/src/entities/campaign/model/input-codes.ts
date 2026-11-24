import type { CampaignProductType } from "./codes";

// 등록 단계 입력값의 서버 코드(API 요구 명세 "코드" 표). 화면 문구는 코드마다 번역 키를 둠.

/** 캠페인 유형. 구매리뷰형은 스펙아웃(2026-11-13). */
export const CAMPAIGN_TYPES = [
  "PRODUCT_DELIVERY",
  "PRESS",
  "STORE_VISIT",
] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

/** 3단계 플랫폼(시안 순서). 크리에이터 검색용 `entities/platform`(4개)과 따로 둠. */
export const CAMPAIGN_PLATFORMS = [
  "INSTAGRAM",
  "NAVER_BLOG",
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "X",
] as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];

export const CREATOR_GENDERS = ["FEMALE", "MALE", "ALL"] as const;
export type CreatorGender = (typeof CREATOR_GENDERS)[number];

export const CREATOR_AGE_GROUPS = [
  "AGE_10S",
  "AGE_20S",
  "AGE_30S",
  "AGE_40S",
  "AGE_50S_PLUS",
] as const;
export type CreatorAgeGroup = (typeof CREATOR_AGE_GROUPS)[number];

/** 포스팅 주제. 크리에이터 카테고리 대분류 20개 + 전체(`All`), 서버 `trans_key` 표기 그대로(목록 조회 API 없음). */
export const POSTING_TOPICS = [
  "DigitalAppliances",
  "Education",
  "SportsLeisure",
  "MarketTools",
  "Beauty",
  "LivingHealth",
  "TravelCulture",
  "AgeProfession",
  "FoodCooking",
  "DailyLife",
  "Region",
  "BookPublication",
  "PregnancyParenting",
  "Hobby",
  "Fashion",
  "Food",
  "FurnitureInterior",
  "Pet",
  "ASMR",
  "Review",
  "All",
] as const;
export type PostingTopic = (typeof POSTING_TOPICS)[number];

/** 공구형 포스팅 주제(시안 순서). 서버 코드 중 이 9개만 고르게 하고 "무관"은 `All`. */
export const GROUP_BUY_POSTING_TOPICS = [
  "All",
  "Beauty",
  "LivingHealth",
  "PregnancyParenting",
  "Food",
  "DigitalAppliances",
  "FurnitureInterior",
  "Fashion",
  "TravelCulture",
] as const satisfies readonly PostingTopic[];

/** 상품 유형에서 고를 수 있는 포스팅 주제. */
export function getPostingTopics(
  productType: CampaignProductType | null,
): readonly PostingTopic[] {
  return productType === "GROUP_BUY"
    ? GROUP_BUY_POSTING_TOPICS
    : POSTING_TOPICS;
}

/** 부가서비스. PICK형은 둘 다 고를 수 있고 등록 결제는 AI 포스팅 가이드만(원고컨펌은 매칭 때 결제). */
export const CAMPAIGN_ADD_ONS = [
  "POSTING_GUIDE",
  "MANUSCRIPT_CONFIRM",
] as const;
export type CampaignAddOn = (typeof CAMPAIGN_ADD_ONS)[number];

export const CAMPAIGN_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;
export type CampaignMediaType = (typeof CAMPAIGN_MEDIA_TYPES)[number];

/** 서버 값이 목록에 있는 코드면 그 코드, 아니면 null. */
export function toKnownCode<T extends string>(
  codes: readonly T[],
  serverValue: string | null | undefined,
): T | null {
  return codes.find((code) => code === serverValue) ?? null;
}

/** 목록에 있는 코드만 남김. 모르는 코드는 선택지로 보일 수 없어 버림. */
export function filterKnownCodes<T extends string>(
  codes: readonly T[],
  serverValues: readonly string[],
): T[] {
  return serverValues.flatMap((value) => toKnownCode(codes, value) ?? []);
}
