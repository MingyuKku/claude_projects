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
  "SHORTS",
  "REELS",
] as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];

export const CREATOR_GENDERS = ["FEMALE", "MALE", "ALL"] as const;
export type CreatorGender = (typeof CREATOR_GENDERS)[number];

/** "무관"(`ALL`)은 서버가 5개 연령대를 모두 고른 것으로 저장하고 조회에서 `["ALL"]` 하나로 줌. 공구형 시안에만 있음. */
export const CREATOR_AGE_GROUPS = [
  "ALL",
  "AGE_10S",
  "AGE_20S",
  "AGE_30S",
  "AGE_40S",
  "AGE_50S_PLUS",
] as const;
export type CreatorAgeGroup = (typeof CREATOR_AGE_GROUPS)[number];

/** 번역을 가진 포스팅 주제 코드. 무관은 `All`. 어떤 주제를 어떤 순서로 고르게 할지는 서버 목록(`usePostingTopics`)이 정함. 서버가 받는 코드 밖은 400 `INVALID_FIELD`. */
export const POSTING_TOPICS = [
  "All",
  "Beauty",
  "LivingHealth",
  "PregnancyParenting",
  "Food",
  "DigitalAppliances",
  "FurnitureInterior",
  "Fashion",
  "TravelCulture",
] as const;
export type PostingTopic = (typeof POSTING_TOPICS)[number];

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
