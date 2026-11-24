import { DRAFT_STEP_BY_REGISTER_STEP } from "@/entities/campaign";

import type {
  CampaignDraftStep,
  CampaignProductType,
  CampaignRegisterStep,
  CampaignServiceType,
} from "@/entities/campaign";

// 서비스·상품 유형별 단계 구성(스펙 §3 단계 구성). 마법사 골격·주소·저장은 공통이고 유형별 차이는 이 배열과 단계 화면에만 둠.
// 모집형(모집동의서 포함 9단계)은 모집형 갱신 때 배열을 따로 둠.

export interface RegisterStepDefinition {
  step: CampaignRegisterStep;
  /** 이 단계가 저장하는 초안 묶음. 결제는 null. */
  draftStep: CampaignDraftStep | null;
  /** 선택 단계(부가서비스)는 결제 전 검사·사이드바 표시 대상이 아님. */
  isOptional: boolean;
}

const OPTIONAL_STEPS: readonly CampaignRegisterStep[] = ["add-ons"];

function defineSteps(
  steps: readonly CampaignRegisterStep[],
): readonly RegisterStepDefinition[] {
  return steps.map((step) => ({
    step,
    draftStep: DRAFT_STEP_BY_REGISTER_STEP[step],
    isOptional: OPTIONAL_STEPS.includes(step),
  }));
}

const PICK_BRAND_STEPS = defineSteps([
  "campaign-info",
  "product",
  "creator",
  "conditions",
  "intro",
  "add-ons",
  "policy",
  "payment",
]);

// 브랜드형의 진행 조건 자리에 공동구매 조건이 옴.
const PICK_GROUP_BUY_STEPS = defineSteps([
  "campaign-info",
  "product",
  "creator",
  "group-buy",
  "intro",
  "add-ons",
  "policy",
  "payment",
]);

export function getRegisterSteps(
  serviceType: CampaignServiceType,
  productType: CampaignProductType,
): readonly RegisterStepDefinition[] {
  switch (serviceType) {
    case "PICK":
      return productType === "GROUP_BUY"
        ? PICK_GROUP_BUY_STEPS
        : PICK_BRAND_STEPS;
    case "RECRUIT":
      // 모집형은 작성 화면에 오지 않음(준비 중). 갱신 때 모집형 배열로 바꿈.
      return PICK_BRAND_STEPS;
  }
}
