import type { CampaignSection } from "@/entities/campaign";

/**
 * 주소의 `step` 값. 숫자가 아니라 이름을 쓰는 이유는 공구형 9단계가 추가돼도 주소가 바뀌지 않게 하기 위해서임.
 * 표시 순서는 단계 정의 배열이 정함.
 */
export const STEP_SLUGS = [
  "campaign-info",
  "product",
  "influencer",
  "add-ons",
  "intro",
  "conditions",
  "policy",
  "payment",
] as const;
export type StepSlug = (typeof STEP_SLUGS)[number];

export function isStepSlug(value: unknown): value is StepSlug {
  return STEP_SLUGS.some((slug) => slug === value);
}

// 단계 이름(slug) ↔ 서버가 쓰는 섹션 코드(가 본 단계 목록, 반려 사유).
const SECTION_BY_SLUG: Record<StepSlug, CampaignSection> = {
  "campaign-info": "CAMPAIGN_INFO",
  product: "PRODUCT",
  influencer: "INFLUENCER",
  "add-ons": "ADD_ONS",
  intro: "INTRO",
  conditions: "CONDITIONS",
  policy: "POLICY",
  payment: "PAYMENT",
};

export function toSection(slug: StepSlug) {
  return SECTION_BY_SLUG[slug];
}

export function toStepSlug(section: string): StepSlug | undefined {
  return STEP_SLUGS.find((slug) => SECTION_BY_SLUG[slug] === section);
}
