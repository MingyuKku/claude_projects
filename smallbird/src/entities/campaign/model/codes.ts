// 캠페인 등록 API(요구 명세 "코드" 표)의 서버 코드. 서버가 영문 코드를 주고 프론트가 코드마다 번역 키를 둠.
// 모르는 코드가 오면 화면을 깨뜨리지 않고 서버 값을 그대로 보여 주므로, 표시 전용 필드는 `isXxx` 가드로 좁혀 씀.

function isOneOf<const T extends readonly string[]>(values: T) {
  return (value: unknown): value is T[number] =>
    values.some((item) => item === value);
}

/** 서비스 유형. 화면은 `productType`과 합쳐 "PICK형 브랜드형"처럼 씀. */
export const CAMPAIGN_SERVICE_TYPES = ["PICK", "RECRUIT"] as const;
export type CampaignServiceType = (typeof CAMPAIGN_SERVICE_TYPES)[number];
export const isCampaignServiceType = isOneOf(CAMPAIGN_SERVICE_TYPES);

/** 상품 유형. 공구형(`GROUP_BUY`)은 범위 밖. */
export const CAMPAIGN_PRODUCT_TYPES = ["BRAND"] as const;
export type CampaignProductType = (typeof CAMPAIGN_PRODUCT_TYPES)[number];
export const isCampaignProductType = isOneOf(CAMPAIGN_PRODUCT_TYPES);

/** 캠페인 유형. 시안의 토글 순서. */
export const CAMPAIGN_TYPES = [
  "PRODUCT_DELIVERY",
  "PRESS",
  "STORE_VISIT",
  "PURCHASE_REVIEW",
] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];
export const isCampaignType = isOneOf(CAMPAIGN_TYPES);

/** 캠페인 플랫폼 6종. 시안 순서(인스타그램·블로그·페이스북·유튜브·틱톡·엑스). 인플루언서 검색 플랫폼(`entities/platform`)과 별개. */
export const CAMPAIGN_PLATFORMS = [
  "INSTAGRAM",
  "NAVER_BLOG",
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "X",
] as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];
export const isCampaignPlatform = isOneOf(CAMPAIGN_PLATFORMS);

export const CAMPAIGN_GENDERS = ["FEMALE", "MALE", "ALL"] as const;
export type CampaignGender = (typeof CAMPAIGN_GENDERS)[number];
export const isCampaignGender = isOneOf(CAMPAIGN_GENDERS);

export const CAMPAIGN_AGE_GROUPS = [
  "AGE_10S",
  "AGE_20S",
  "AGE_30S",
  "AGE_40S",
  "AGE_50S_PLUS",
] as const;
export type CampaignAgeGroup = (typeof CAMPAIGN_AGE_GROUPS)[number];
export const isCampaignAgeGroup = isOneOf(CAMPAIGN_AGE_GROUPS);

export const CAMPAIGN_TOPICS = [
  "BEAUTY",
  "FASHION",
  "FOOD",
  "TRAVEL",
  "PARENTING",
  "LIFESTYLE",
  "HEALTH",
  "IT",
] as const;
export type CampaignTopic = (typeof CAMPAIGN_TOPICS)[number];
export const isCampaignTopic = isOneOf(CAMPAIGN_TOPICS);

/** 부가서비스. PICK형은 `AI_POSTING_GUIDE`만, 나머지는 모집형만 받음. */
export const CAMPAIGN_ADD_ONS = [
  "AI_POSTING_GUIDE",
  "AI_MANUSCRIPT_CONFIRM",
  "AI_RECEIPT_REVIEW",
] as const;
export type CampaignAddOn = (typeof CAMPAIGN_ADD_ONS)[number];
export const isCampaignAddOn = isOneOf(CAMPAIGN_ADD_ONS);

/** 5단계 작성 방식. */
export const INTRO_MODES = ["AI", "MANUAL"] as const;
export type IntroMode = (typeof INTRO_MODES)[number];

/** 승인 상태. `DRAFT`는 등록 중(승인 요청을 취소한 뒤 포함). */
export const APPROVAL_STATUSES = [
  "DRAFT",
  "REVIEWING",
  "REJECTED",
  "RE_REVIEWING",
  "APPROVED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** 등록 단계이자 등록 내역 섹션. 주소의 `step` slug와는 다름(slug는 `features/register-campaign`이 정함). */
export const CAMPAIGN_SECTIONS = [
  "CAMPAIGN_INFO",
  "PRODUCT",
  "INFLUENCER",
  "ADD_ONS",
  "INTRO",
  "CONDITIONS",
  "POLICY",
  "PAYMENT",
] as const;
export type CampaignSection = (typeof CAMPAIGN_SECTIONS)[number];
export const isCampaignSection = isOneOf(CAMPAIGN_SECTIONS);
