import type { CampaignRegisterStep } from "@/entities/campaign";

/** 단계 이름 번역 키. 단계 제목도 사이드바 단계명과 같게 씀(스펙 §3 시안 오류 통일). */
export const STEP_LABEL_KEYS = {
  "campaign-info": "step.campaignInfo",
  product: "step.product",
  influencer: "step.influencer",
  "add-ons": "step.addOns",
  intro: "step.intro",
  conditions: "step.conditions",
  policy: "step.policy",
  payment: "step.payment",
} as const satisfies Record<CampaignRegisterStep, string>;
