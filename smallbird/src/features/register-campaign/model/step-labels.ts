import type {
  CampaignProductType,
  CampaignRegisterStep,
} from "@/entities/campaign";

/** 단계 이름 번역 키. 단계 제목도 사이드바 단계명과 같게 씀(스펙 §3 시안 오류 통일). */
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

/** 단계 이름 번역 키. 공구형 2단계는 4단계 공동구매 조건의 제품명과 구분하려고 "협찬 제품 정보 입력"으로 씀. */
export function getStepLabelKey(
  step: CampaignRegisterStep,
  productType: CampaignProductType | null,
) {
  if (step === "product" && productType === "GROUP_BUY") {
    return "step.productGroupBuy";
  }
  return STEP_LABEL_KEYS[step];
}
