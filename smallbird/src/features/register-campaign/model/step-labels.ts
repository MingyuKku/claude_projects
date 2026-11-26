import type { CampaignRegisterStep } from "@/entities/campaign";

/**
 * 단계 이름 번역 키. 단계 제목도 사이드바 단계명과 같게 씀(스펙 §3 시안 오류 통일). 2단계는 PICK형의 브랜드형·공구형 모두
 * "협찬 제품 정보 입력"이고, 공구형 4단계 공동구매 조건의 제품명과도 구분됨.
 */
export const STEP_LABEL_KEYS = {
  "campaign-info": "step.campaignInfo",
  product: "step.product",
  creator: "step.creator",
  "group-buy": "step.groupBuy",
  "add-ons": "step.addOns",
  intro: "step.intro",
  conditions: "step.conditions",
  policy: "step.policy",
  payment: "step.payment",
} as const satisfies Record<CampaignRegisterStep, string>;
