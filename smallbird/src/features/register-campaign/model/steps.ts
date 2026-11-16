import {
  CAMPAIGN_REGISTER_STEPS,
  DRAFT_STEP_BY_REGISTER_STEP,
} from "@/entities/campaign";

import type {
  CampaignDraftStep,
  CampaignRegisterStep,
  CampaignServiceType,
} from "@/entities/campaign";

// 서비스 유형별 단계 구성(스펙 §3 단계 구성). 마법사 골격·주소·저장은 공통이고 유형별 차이는 이 배열과 단계 화면에만 둠.
// 모집형(모집동의서 포함 9단계)은 모집형 갱신 때 배열을 따로 둠.

export interface RegisterStepDefinition {
  step: CampaignRegisterStep;
  /** 이 단계가 저장하는 초안 묶음. 결제는 null. */
  draftStep: CampaignDraftStep | null;
  /** 선택 단계(부가서비스)는 결제 전 검사·사이드바 표시 대상이 아님. */
  isOptional: boolean;
}

const OPTIONAL_STEPS: readonly CampaignRegisterStep[] = ["add-ons"];

const PICK_STEPS: readonly RegisterStepDefinition[] =
  CAMPAIGN_REGISTER_STEPS.map((step) => ({
    step,
    draftStep: DRAFT_STEP_BY_REGISTER_STEP[step],
    isOptional: OPTIONAL_STEPS.includes(step),
  }));

export function getRegisterSteps(
  serviceType: CampaignServiceType,
): readonly RegisterStepDefinition[] {
  switch (serviceType) {
    case "PICK":
      return PICK_STEPS;
    case "RECRUIT":
      // 모집형은 작성 화면에 오지 않음(준비 중). 갱신 때 모집형 배열로 바꿈.
      return PICK_STEPS;
  }
}
